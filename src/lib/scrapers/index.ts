import { launchBrowser } from "./browser";
import { kindleScraper } from "./kindle";
import { pubuScraper } from "./pubu";
import { readmooScraper } from "./readmoo";
import { ScrapedBook, Scraper } from "./types";

// 博客來、Kobo、Hyread 有 Cloudflare 機器人偵測，headless browser 會卡在驗證頁，暫不支援自動抓取
const SCRAPERS: Scraper[] = [readmooScraper, kindleScraper, pubuScraper];

export function findScraper(url: string): Scraper | null {
  return SCRAPERS.find((s) => s.matches(url)) ?? null;
}

export async function scrapeBookUrl(url: string): Promise<ScrapedBook> {
  const scraper = findScraper(url);
  if (!scraper) {
    throw new Error("不支援的書籍平台");
  }

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    return await scraper.scrape(page);
  } finally {
    await browser.close();
  }
}
