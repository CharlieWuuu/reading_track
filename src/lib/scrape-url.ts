import { ScrapedArticle } from "@/lib/scrapers/article";

/**
 * 通用網址剖析：讀 OpenGraph／JSON-LD，站台改版也吃得下大部分頁面。
 * 書籍走的是各平台專用剖析器（/api/scrape），跟這支是兩條路。
 *
 * 抓不到會丟例外，訊息由 route 給。
 */
export async function scrapeUrl(url: string): Promise<ScrapedArticle> {
  const res = await fetch("/api/scrape-article", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "抓取失敗");
  return data;
}
