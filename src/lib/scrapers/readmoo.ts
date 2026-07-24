import { Scraper } from "./types";
import { getMeta, getText } from "./helpers";

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

    return {
      title,
      author,
      isbn: "",
      coverUrl,
      publisher,
      platform: "讀墨",
    };
  },
};
