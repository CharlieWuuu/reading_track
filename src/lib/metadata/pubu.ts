import type { CheerioAPI } from "cheerio";
import { normalizeIsbn } from "@/utils/isbn";
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
 * 商品規格表：一列是「col-4 標籤 ＋ col-8 值」。
 *
 * 一頁上不只一本書——同一本的其他版本（紙本、套書）也會列出自己的規格，
 * 而且欄位還不一樣（電子書給「字數」，另一版給「Pages」）。照文件順序切成
 * 一塊一塊、用「ID」當分界，網址那本的那一塊排最前面，其餘的排在後面備用：
 * 同一本書的不同版本，長度本來就是同一個量級，缺頁數時拿紙本的來補是合理的。
 */
function specsForBook($: CheerioAPI, bookId: string): Map<string, string>[] {
  const blocks: Array<Map<string, string>> = [];
  let current = new Map<string, string>();

  $("div.row").each((_, el) => {
    const row = $(el);
    const label = row.children("div.col-4").first().text().trim();
    const value = row.children('div[class^="col-8"]').first().text().trim();
    if (!label || !value) return;

    current.set(label, value);
    if (label === "ID") {
      blocks.push(current);
      current = new Map();
    }
  });
  if (current.size > 0) blocks.push(current);

  const mine = blocks.filter((block) => block.get("ID")?.startsWith(bookId));
  const others = blocks.filter((block) => !mine.includes(block));
  return [...mine, ...others];
}

/** 先問這本書自己的規格，缺了才往其他版本找 */
function pick(blocks: Map<string, string>[], labels: string[]): string {
  for (const block of blocks) {
    for (const label of labels) {
      const value = digits(block.get(label));
      if (value) return value;
    }
  }
  return "";
}

/** 「83,068」→「83068」；千分位留著會讓後面的數字處理全部要重寫 */
function digits(value: string | undefined): string {
  const match = value?.match(/[\d,]+/);
  return match ? match[0].replace(/,/g, "") : "";
}

/**
 * Pubu 電子書城。作者／出版社／書封來自 JSON-LD，字數與頁數在商品規格表裡。
 * 不像讀墨會擋機房 IP，是線上環境唯一抓得到中文電子書字數的來源。
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

    const specs = specsForBook($, url.match(/\/(?:ebook|album)\/(\d+)/)?.[1] ?? "");

    return {
      title,
      wordCount: pick(specs, ["字數", "Word count"]),
      pageCount: pick(specs, ["頁數", "Pages"]),
      isbn: normalizeIsbn(pick(specs, ["ISBN", "EISBN"])),
      author: data.author?.trim() ?? "",
      publisher: data.publisher?.trim() ?? "",
      language: data.inLanguage
        ? (LANGUAGE_BY_TAG[data.inLanguage] ?? normalizeLanguage(data.inLanguage))
        : "",
      coverUrl: data.image?.trim() ?? "",
      source: "Pubu",
      sourceUrl: url,
    };
  },
};
