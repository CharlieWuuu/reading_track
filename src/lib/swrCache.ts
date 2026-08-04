import type { Cache, State } from "swr";

const STORAGE_KEY = "reading-track-swr-cache";
/** 超過這個時間的快取就不再拿來墊畫面，避免看到太舊的資料 */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface Persisted {
  savedAt: number;
  entries: [string, { data: unknown }][];
}

/**
 * 把 SWR 快取存進 localStorage，重新整理或關掉 App 再打開時，
 * 可以先用舊資料把畫面畫出來，再於背景重新抓。
 */
/** 由 provider 設定；SWR 每次抓到資料就呼叫它，把快取寫回 localStorage */
let saveCache: (() => void) | null = null;

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
        for (const [key, value] of parsed.entries) map.set(key, value as State);
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  const save = () => {
    try {
      // 只留成功抓到的資料，錯誤與載入狀態不必留到下次
      const entries: Persisted["entries"] = [];
      for (const [key, value] of map) {
        const data = (value as { data?: unknown } | undefined)?.data;
        if (data !== undefined) entries.push([key, { data }]);
      }
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ savedAt: Date.now(), entries } satisfies Persisted)
      );
    } catch {
      // 空間不足或隱私模式就放棄快取，不影響功能
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

export function clearSWRCache() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略
  }
}
