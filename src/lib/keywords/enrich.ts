import { saveKeywordInfos } from "@/lib/db/mutations/records";
import { listKeywords as listKeywordInfos } from "@/lib/db/queries/records";
import { lookupKeyword } from "@/lib/keywords/wikipedia";
import { KeywordInfo } from "@/types/keyword";

/** 一次補太多會打爆維基也拖垮 request，多的留給下一次 */
const MAX_PER_RUN = 20;

/** 連續打 Wikidata 會被回「too many requests」，隔一下再問下一個 */
const GAP_MS = 300;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 有維基連結，或使用者自己手填了摘要，都算有資料了 */
const isFilled = (info: KeywordInfo) => Boolean(info.wikiUrl || info.summary);

/**
 * 這次要查哪幾個。
 *
 * 平常只查主檔裡沒有的那些：查過就會留下一列，即使是空的，那代表「維基沒有這個條目」，
 * 不該每次補齊都再去問一次。`retry` 時連空的那些也重查。
 */
export function pendingNames(names: string[], existing: KeywordInfo[], retry = false): string[] {
  const known = new Set((retry ? existing.filter(isFilled) : existing).map((info) => info.name));
  return names.map((n) => n.trim()).filter((n) => n && !known.has(n));
}

export type EnrichResult = { added: number; found: number; remaining: number };

/** 把還沒查過的關鍵字查回來寫進主檔，回報這次補了幾個、還剩幾個 */
export async function enrichKeywords(names: string[], retry = false): Promise<EnrichResult> {
  const existing = await listKeywordInfos();
  const pending = pendingNames(names, existing, retry);

  const infos: KeywordInfo[] = [];
  for (const name of pending.slice(0, MAX_PER_RUN)) {
    if (infos.length > 0) await sleep(GAP_MS);
    const found = await lookupKeyword(name);
    // 領域是手動填的，維基查回來的那一份不帶它，重查也不能把人填的洗掉
    const previous = existing.find((info) => info.name === name);
    infos.push({ ...found, topics: previous?.topics ?? "" });
  }
  await saveKeywordInfos(infos);

  return {
    added: infos.length,
    // 查得到摘要的才算補到東西，其餘是維基沒有這個條目
    found: infos.filter((info) => info.summary).length,
    remaining: Math.max(0, pending.length - infos.length),
  };
}
