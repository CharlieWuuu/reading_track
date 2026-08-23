import type { Cache, State } from "swr";
import { approximateBytes, trimToBudget } from "@/utils/cache-budget";

const STORAGE_KEY = "reading-track-swr-cache";
/** 超過這個時間的快取就不再拿來墊畫面，避免看到太舊的資料 */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface Persisted {
  savedAt: number;
  writings: [string, { data: unknown }][];
}

/**
 * 把 SWR 快取存進 localStorage，重新整理或關掉 App 再打開時，
 * 可以先用舊資料把畫面畫出來，再於背景重新抓。
 */
/** 由 provider 設定；SWR 每次抓到資料就呼叫它，把快取寫回 localStorage */
let saveCache: (() => void) | null = null;
/** 清掉之後就不准再寫回去，否則 beforeunload 又把資料存了一次 */
let disabled = false;

/**
 * 立刻把目前的快取存起來。
 *
 * 只靠 beforeunload／visibilitychange 不夠可靠——手機被系統直接收掉、
 * 或分頁當掉就沒存到，下次開啟又要空白等載入。抓到新資料就順手存一次最保險。
 */
export function persistSWRCache() {
  saveCache?.();
}

export function localStorageProvider(): Cache {
  const map = new Map<string, State>();

  if (typeof window === "undefined") return map;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Persisted;
      if (Date.now() - parsed.savedAt < MAX_AGE_MS) {
        for (const [key, value] of parsed.writings) map.set(key, value as State);
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  const save = () => {
    if (disabled) return;
    try {
      // 只留成功抓到的資料，錯誤與載入狀態不必留到下次
      const all: Persisted["writings"] = [];
      for (const [key, value] of map) {
        // 解鎖狀態下抓到的資料含私人項目，不落地——不然鎖上之後翻 localStorage 還是看得到
        if (key.includes("unlock=")) continue;
        const data = (value as { data?: unknown } | undefined)?.data;
        if (data !== undefined) all.push([key, { data }]);
      }

      // 資料越來越多之後整份會超過 localStorage 的額度。原本是 setItem 失敗就
      // catch 掉，結果變成完全沒有快取、每次開啟都空白等載入，而且毫無跡象。
      // 改成丟掉最大的那幾筆，小表還是墊得住畫面
      const { kept, dropped } = trimToBudget(all);
      if (dropped.length > 0) {
        console.warn(`[swr-cache] 超過額度，這幾筆不落地：${dropped.join(", ")}`);
      }

      const payload = JSON.stringify({ savedAt: Date.now(), writings: kept } satisfies Persisted);
      localStorage.setItem(STORAGE_KEY, payload);
      snapshot = { raw: payload, parsed: { savedAt: Date.now(), writings: kept } };
    } catch {
      // 隱私模式或仍然塞不下就放棄快取，不影響功能
      snapshot = null;
    }
  };

  saveCache = save;

  // 手機常常是直接切走 App，不會觸發 beforeunload，所以兩個都聽
  window.addEventListener("beforeunload", save);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });

  return map;
}

/**
 * 上一次讀到／寫出的那一份，避免每次呼叫都重新 parse。
 *
 * `readCached` 是在 render 當中被呼叫的（SWR 的 fallbackData），而每次呼叫
 * 都要 JSON.parse 整份快取。資料一多，光是這個就會讓每次 render 多花好幾毫秒，
 * 而且每支 hook、每個用到它的元件各算一次。
 */
let snapshot: { raw: string; parsed: Persisted } | null = null;

function readSnapshot(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    if (snapshot?.raw !== raw) snapshot = { raw, parsed: JSON.parse(raw) as Persisted };
    return snapshot.parsed;
  } catch {
    return null;
  }
}

/**
 * 直接從 localStorage 取某個 key 的舊資料。
 *
 * SWR 的 provider 也會讀同一份快取，但它是在 SWRConfig 掛載時才建立，
 * 而 sheetId 是等 zustand 還原之後才出現的——兩者的時序不保證對得上，
 * 中間那一瞬間畫面就會閃「載入中」。這個函式讓 hook 可以自己拿舊資料當
 * fallback，不必去賭那個時序。
 */
export function readCached<T>(key: string | null): T | undefined {
  if (!key || typeof window === "undefined") return undefined;
  const parsed = readSnapshot();
  if (!parsed || Date.now() - parsed.savedAt >= MAX_AGE_MS) return undefined;
  const hit = parsed.writings.find(([k]) => k === key);
  return hit ? (hit[1].data as T) : undefined;
}

/** 這份快取現在多大（估計值）。設定頁的「資料維護」拿來顯示 */
export function cachedBytes(): number {
  if (typeof window === "undefined") return 0;
  try {
    return approximateBytes(localStorage.getItem(STORAGE_KEY) ?? "");
  } catch {
    return 0;
  }
}

export function clearSWRCache() {
  disabled = true;
  snapshot = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略
  }
}
