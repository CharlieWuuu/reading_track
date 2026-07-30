import type { CheerioAPI } from "cheerio";
import { fetchDom } from "./http";
import { normalizeLanguage } from "./readmoo";
import { Candidate, MetadataProvider } from "./types";

interface BookJsonLd {
  "@type"?: string;
  name?: string;
  author?: string;
  publisher?: string;
  inLanguage?: string;
  image?: string;
}

const LANGUAGE_BY_TAG: Record<string, string> = {
  "zh-TW": "中文",
  "zh-CN": "中文",
  zh: "中文",
  en: "英文",
  ja: "日文",
};

/**
 * Pubu 電子書城。商品頁附了 schema.org 的 JSON-LD，
 * 書名／作者／出版社／語言／書封一次取齊，不必去猜版面上的標籤位置。
 */
function bookJsonLd($: CheerioAPI): BookJsonLd | undefined {
  let found: BookJsonLd | undefined;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (found) return;
    try {
      const data = JSON.parse($(el).text()) as BookJsonLd | BookJsonLd[];
      const list = Array.isArray(data) ? data : [data];
      found = list.find((item) => item["@type"] === "Book");
    } catch {
      // 頁面上還有其他 JSON-LD（麵包屑之類的），解析失敗就換下一個
    }
  });
  return found;
}

/**
 * Pubu 沒有頁數也沒有字數，但作者／出版社／書封齊全，而且不像讀墨會擋機房 IP，
 * 是線上環境的中文書來源之一。
 */
export const pubuProvider: MetadataProvider = {
  name: "Pubu",

  findCandidates: async (query) => {
    const $ = await fetchDom(`https://www.pubu.com.tw/search?q=${encodeURIComponent(query)}`);
    if (!$) return [];

    const candidates: Candidate[] = [];
    // 電子書是 /ebook/<id>，有聲書是 /album/<id>
    $('a[href*="/ebook/"], a[href*="/album/"]').each((_, el) => {
      const href = $(el).attr("href")?.split("?")[0];
      if (!href || !/\/(ebook|album)\/\d+$/.test(href)) return;

      const title = ($(el).attr("title") || $(el).find("img").attr("alt") || $(el).text()).trim();
      if (!title) return;

      const url = `https://www.pubu.com.tw${href}`;
      if (candidates.some((c) => c.url === url)) return;
      candidates.push({ title, url });
    });
    return candidates;
  },

  fetchDetail: async (url) => {
    const $ = await fetchDom(url);
    if (!$) return null;

    const data = bookJsonLd($);
    if (!data) return null;
    const title = data.name?.trim();
    if (!title) return null;

    return {
      title,
      author: data.author?.trim() ?? "",
      publisher: data.publisher?.trim() ?? "",
      language: data.inLanguage
        ? LANGUAGE_BY_TAG[data.inLanguage] ?? normalizeLanguage(data.inLanguage)
        : "",
      coverUrl: data.image?.trim() ?? "",
      source: "Pubu",
      sourceUrl: url,
    };
  },
};
