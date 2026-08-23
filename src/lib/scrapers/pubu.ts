import { normalizeIsbn } from "@/utils/isbn";
import { getJsonLd, getMeta } from "./helpers";
import { Scraper } from "./types";

export const pubuScraper: Scraper = {
  platform: "Pubu",
  matches: (url) => url.includes("pubu.com.tw"),
  scrape: async (page) => {
    const book = await getJsonLd(page, "Book");
    const title = (book?.name as string) ?? (await getMeta(page, "og:title"));
    const coverUrl = (book?.image as string) ?? (await getMeta(page, "og:image"));

    return {
      title,
      author: (book?.author as string) ?? "",
      coverUrl,
      publisher: (book?.publisher as string) ?? "",
      platform: "Pubu",
      isbn: normalizeIsbn(book?.isbn as string | undefined),
    };
  },
};
