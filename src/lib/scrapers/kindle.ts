import { normalizeIsbn } from "@/utils/isbn";
import { getText } from "./helpers";
import { Scraper } from "./types";

async function getLabelValue(page: import("playwright-core").Page, label: string): Promise<string> {
  const el = await page.$(`text=${label}`);
  if (!el) return "";
  const sibling = await el.evaluateHandle((node) => node.nextElementSibling);
  const text = await sibling.asElement()?.textContent();
  return text?.trim() ?? "";
}

export const kindleScraper: Scraper = {
  platform: "Kindle",
  matches: (url) => url.includes("amazon.co.jp") || url.includes("amazon.com"),
  scrape: async (page) => {
    const title = await getText(page, "#productTitle");
    const author = await getText(page, "#bylineInfo a");
    const publisher = await getLabelValue(page, "Publisher");
    const pageCount = (await getLabelValue(page, "Print length")).match(/\d+/)?.[0] ?? "";
    const language = await getLabelValue(page, "Language");
    // 電子書只有 ASIN，紙本才給 ISBN；抓不到就留空
    const isbn = normalizeIsbn(
      (await getLabelValue(page, "ISBN-13")) || (await getLabelValue(page, "ISBN-10")),
    );

    const coverUrl = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll("script"));
      for (const script of scripts) {
        const match = script.textContent?.match(/"hiRes":"(https:[^"]+)"/);
        if (match) return match[1];
      }
      return "";
    });

    return { title, author, coverUrl, publisher, platform: "Kindle", pageCount, language, isbn };
  },
};
