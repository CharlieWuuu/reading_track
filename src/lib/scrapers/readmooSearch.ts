import type { Page } from "playwright-core";
import { launchBrowser } from "./browser";
import { readmooScraper } from "./readmoo";
import { ScrapedBook } from "./types";

export async function searchReadmoo(title: string): Promise<ScrapedBook | null> {
  const browser = await launchBrowser();
  try {
    const page: Page = await browser.newPage();
    await page.goto("https://readmoo.com/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const searchInput = page
      .locator('input[type="search"], input[placeholder*="關鍵字"]')
      .first();
    const inputReady = await searchInput
      .waitFor({ state: "visible", timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    if (!inputReady) return null;

    await searchInput.click();
    await searchInput.fill(title);

    const firstResult = page.locator('li[role="button"][title]').first();
    const found = await firstResult
      .waitFor({ state: "visible", timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    if (!found) return null;

    await firstResult.click();
    await page.waitForURL(/readmoo\.com\/book\//, { timeout: 8000 }).catch(() => null);

    if (!page.url().includes("readmoo.com/book/")) return null;

    return await readmooScraper.scrape(page);
  } finally {
    await browser.close();
  }
}
