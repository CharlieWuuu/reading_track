import { normalizeIsbn } from "@/utils/isbn";
import { normalizeLanguage } from "../metadata/readmoo";
import { getMeta, getText } from "./helpers";
import { Scraper } from "./types";

export const readmooScraper: Scraper = {
  platform: "讀墨",
  matches: (url) => url.includes("readmoo.com"),
  scrape: async (page) => {
    const rawTitle = await getMeta(page, "og:title");
    // og:title format: "書名 - 作者 | Readmoo 讀墨電子書"
    const [titlePart, authorPart] = rawTitle.split(" - ");
    const title = titlePart?.trim() ?? rawTitle;
    const author =
      authorPart?.replace(/\s*\|\s*Readmoo.*$/, "").trim() ??
      (await getText(page, ".book-meta-author"));

    const coverUrl = await getMeta(page, "og:image");
    const publisher = await getText(page, ".publisher-info");

    const bodyText = (await page.textContent("body"))?.replace(/\s+/g, " ") ?? "";
    const wordCount = bodyText.match(/字數\s*[:：]\s*([\d,]+)/)?.[1].replace(/,/g, "") ?? "";
    const language = normalizeLanguage(bodyText.match(/語言\s*[:：]\s*(\S{1,10})/)?.[1] ?? "");
    const isbn = normalizeIsbn(bodyText.match(/E?ISBN\s*[:：]\s*([\dXx-]+)/)?.[1] ?? "");

    return {
      title,
      author,
      coverUrl,
      publisher,
      platform: "讀墨",
      wordCount,
      language,
      isbn,
    };
  },
};
