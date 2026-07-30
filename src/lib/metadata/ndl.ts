import * as cheerio from "cheerio";
import { fetchText, resourceExists } from "./http";
import { BookMetadata, Candidate, MetadataProvider } from "./types";

/** 有假名就幾乎確定是日文書；純漢字的日文書名要靠 Sheet 上標的語言才認得出來 */
export function looksJapanese(text: string): boolean {
  return /[぀-ゟ゠-ヿ]/.test(text);
}

/**
 * 國會圖書館的書封只認自家的 Referer，直接放進 <img> 會被回 403，
 * 所以存的是我們自己的代理網址（見 /api/cover）。
 */
export const NDL_THUMBNAIL_HOST = "ndlsearch.ndl.go.jp";

export function ndlThumbnailUrl(isbn: string): string {
  return `https://${NDL_THUMBNAIL_HOST}/thumbnail/${isbn.replace(/-/g, "")}.jpg`;
}

export const NDL_REFERER = { Referer: "https://ndlsearch.ndl.go.jp/" };

/** 沒有書封的 ISBN 會回 404，先確認過才寫進 Sheet，免得留一堆破圖 */
async function coverIfExists(isbn: string): Promise<string> {
  if (!isbn) return "";
  const url = ndlThumbnailUrl(isbn);
  return (await resourceExists(url, NDL_REFERER)) ? `/api/cover?src=${encodeURIComponent(url)}` : "";
}

const cache = new Map<string, BookMetadata & { isbn?: string }>();
const CACHE_LIMIT = 200;

function remember(url: string, metadata: BookMetadata & { isbn?: string }) {
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
 * 國立国会図書館サーチ的 OpenSearch API：免費、免申請、沒有額度限制，
 * 日文書的權威書目來源（作者／出版社／頁數），書封走 thumbnail 服務。
 */
export const ndlProvider: MetadataProvider = {
  name: "國立國會圖書館",

  findCandidates: async (query, hints) => {
    if (!looksJapanese(query) && hints?.language !== "日文") return [];

    const xml = await fetchText(
      `https://ndlsearch.ndl.go.jp/api/opensearch?title=${encodeURIComponent(
        query
      )}&cnt=5&mediatype=books`,
      { strict: true }
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

      const isbn = item
        .find("dc\\:identifier")
        .filter((_, id) => ($(id).attr("xsi:type") ?? "").includes("ISBN"))
        .map((_, id) => $(id).text().replace(/-/g, ""))
        .get()
        // 13 碼的優先，thumbnail 服務對 13 碼的命中率高得多
        .sort((a, b) => b.length - a.length)[0];

      remember(url, {
        title,
        author: authors.join(", "),
        publisher: item.find("dc\\:publisher").first().text().trim(),
        pageCount: extentToPageCount(item.find("dc\\:extent").first().text()),
        language: "日文",
        source: "國立國會圖書館",
        sourceUrl: url,
        isbn,
      });
      candidates.push({ title, url });
    });

    return candidates;
  },

  // 書封要多打一次網路確認，只有真的被選中的那筆才查
  fetchDetail: async (url) => {
    const hit = cache.get(url);
    if (!hit) return null;
    const { isbn, ...metadata } = hit;
    return { ...metadata, coverUrl: await coverIfExists(isbn ?? "") };
  },
};
