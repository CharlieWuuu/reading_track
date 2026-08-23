/** 欄位型別跟著 Sheet 走：數字也存字串，Sheet 打開來要看得懂 */
export type WritingStatsResult = {
  title?: string;
  platform: string;
  views: string;
  reads: string;
};

/** 抓那篇文章現在的瀏覽數。抓不到會丟例外，訊息由 route 給 */
export async function scrapeWritingStats(url: string): Promise<WritingStatsResult> {
  const res = await fetch("/api/scrape-stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const stats = await res.json();
  if (!res.ok) throw new Error(stats.error ?? "抓取失敗");
  return stats as WritingStatsResult;
}
