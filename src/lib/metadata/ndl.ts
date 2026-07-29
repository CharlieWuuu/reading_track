import * as cheerio from "cheerio";
import { fetchText } from "./http";
import { BookMetadata, Candidate, MetadataProvider } from "./types";

/** 有假名就幾乎確定是日文書；純漢字書名交給 Google Books 就好 */
export function looksJapanese(text: string): boolean {
  return /[぀-ゟ゠-ヿ]/.test(text);
}

const cache = new Map<string, BookMetadata>();
const CACHE_LIMIT = 200;

function remember(url: string, metadata: BookMetadata) {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(url, metadata);
}

/**
 * 形態欄可能是「181p」，也可能是有聲書的「3巻 (3時間50分)」。
 * 只認得出 p 結尾的才是頁數，不然會把「3 巻」當成 3 頁。
 */
function extentToPageCount(raw: string): string {
  return raw.match(/(\d+)\s*p/)?.[1] ?? "";
}

/** 著者欄長得像「Dauten, Dale A, 1950-」，年份對讀者沒意義，去掉 */
function cleanCreator(raw: string): string {
  return raw.replace(/,\s*\d{4}-?\d{0,4}\s*$/, "").trim();
}

/**
 * 國立国会図書館サーチ的 OpenSearch API：免費、免申請，日文書的權威書目來源。
 * 只有書目資料（作者／出版社／頁數），沒有書封。
 */
export const ndlProvider: MetadataProvider = {
  name: "國立國會圖書館",

  findCandidates: async (query) => {
    if (!looksJapanese(query)) return [];

    const xml = await fetchText(
      `https://ndlsearch.ndl.go.jp/api/opensearch?title=${encodeURIComponent(
        query
      )}&cnt=5&mediatype=books`
    );
    if (!xml) return [];

    const $ = cheerio.load(xml, { xmlMode: true });
    const candidates: Candidate[] = [];

    $("item").each((i, el) => {
      const item = $(el);
      const title = item.find("dc\\:title").first().text().trim();
      if (!title) return;

      const url = item.find("link").first().text().trim() || `ndl:${query}:${i}`;
      const authors = item
        .find("dc\\:creator")
        .map((_, c) => cleanCreator($(c).text()))
        .get()
        .filter(Boolean);

      remember(url, {
        title,
        author: authors.join(", "),
        publisher: item.find("dc\\:publisher").first().text().trim(),
        pageCount: extentToPageCount(item.find("dc\\:extent").first().text()),
        language: "日文",
        source: "國立國會圖書館",
        sourceUrl: url,
      });
      candidates.push({ title, url });
    });

    return candidates;
  },

  fetchDetail: async (url) => cache.get(url) ?? null,
};
