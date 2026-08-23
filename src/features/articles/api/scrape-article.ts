/** 貼網址抓文章的標題、作者、站台。抓不到會丟例外，訊息由 route 給 */
export async function scrapeArticle(url: string): Promise<Record<string, unknown>> {
  const res = await fetch("/api/scrape-article", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const found = await res.json();
  if (!res.ok) throw new Error(found.error ?? "抓取失敗");
  return found;
}
