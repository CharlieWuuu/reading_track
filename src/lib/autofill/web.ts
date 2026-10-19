import { scrapeArticleUrl } from "@/lib/scrapers/article";
import { bookToFields } from "@/utils/scraped-values";

/** 讀網頁的 OpenGraph／JSON-LD：標題、作者、出處。讀不到網址會丟錯，沒有標題就當查不到 */
export async function lookupWeb(url: string): Promise<Record<string, string> | null> {
  const found = await scrapeArticleUrl(url);
  return found.title ? bookToFields(found) : null;
}
