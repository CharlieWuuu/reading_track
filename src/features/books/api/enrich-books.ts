/** 一次補齊的結果；欄位對應 /api/books/enrich 的回應 */
export type EnrichResult = {
  scanned: number;
  updated: number;
  notFound: number;
  noNewData: number;
  remaining: number;
  /** 還沒掃完就帶著它再呼叫一次；掃完是 null */
  nextAfter: string | null;
  idsBackfilled: number;
  /** 各取前十筆，只是給人看的訊息，不是完整清單 */
  notFoundTitles: string[];
  noNewDataTitles: string[];
  sourceIssues: string[];
};

/**
 * 從網路補齊 Sheet 裡沒填的欄位。
 *
 * 一次跑不完會回 nextAfter，帶著它再呼叫一次就從那裡接下去——
 * route 有 30 秒上限，書多的時候一定會中斷。
 */
export async function enrichBooks(sheetId: string, after: string | null): Promise<EnrichResult> {
  const res = await fetch("/api/books/enrich", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sheetId, after }),
  });
  const data = await res.json();
  if (!res.ok) {
    // 中斷前補了幾筆也要講：那些是真的補進去了，不是白跑
    const progress = typeof data.updated === "number" ? `（已補齊 ${data.updated} 筆後中斷）` : "";
    throw new Error(`${data.error ?? "補齊失敗"}${progress}`);
  }
  return data as EnrichResult;
}
