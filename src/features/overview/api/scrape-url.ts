export type ScrapedFields = { title?: string; author?: string; platform?: string };

/**
 * 通用網址剖析：讀 OpenGraph／JSON-LD，站台改版也吃得下大部分頁面。
 * 內建的書籍抓取器是各平台專用的剖析器，這支服務的是自訂類型——沒有專用剖析器，
 * 能拿到多少算多少。
 */
export async function scrapeUrl(url: string): Promise<ScrapedFields> {
  const res = await fetch("/api/scrape-article", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "抓取失敗");
  return data;
}
