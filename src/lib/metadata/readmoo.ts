import { digitsOnly, fetchDom, flatText, labelValue } from "./http";
import { BookMetadata, Candidate, MetadataProvider } from "./types";

/**
 * 讀墨搜尋頁與書籍頁都是伺服器渲染的，直接抓 HTML 就好，
 * 不需要開無頭瀏覽器，也沒有 API 額度問題。
 */
export const readmooProvider: MetadataProvider = {
  name: "讀墨",

  findCandidates: async (query) => {
    const $ = await fetchDom(
      `https://readmoo.com/search/keyword?q=${encodeURIComponent(query)}&pi=0&st=true`
    );
    if (!$) return [];

    const candidates: Candidate[] = [];
    $('a[href*="readmoo.com/book/"]').each((_, el) => {
      const href = $(el).attr("href")?.split("?")[0];
      const title = ($(el).attr("title") || $(el).text()).trim();
      if (!href || !title) return;
      if (candidates.some((c) => c.url === href)) return;
      candidates.push({ title, url: href });
    });
    return candidates;
  },

  fetchDetail: async (url) => {
    const $ = await fetchDom(url);
    if (!$) return null;

    const rawTitle = $('meta[property="og:title"]').attr("content") ?? "";
    // og:title 格式："書名 - 作者 | Readmoo 讀墨電子書"
    const title = rawTitle.split(" - ")[0]?.trim() ?? "";
    if (!title) return null;

    const text = flatText($);
    const metadata: BookMetadata = {
      title,
      author: stripFollow(labelValue(text, "作者")),
      publisher: stripFollow(labelValue(text, "出版社")),
      language: normalizeLanguage(labelValue(text, "語言")),
      wordCount: digitsOnly(labelValue(text, "字數")),
      coverUrl: $('meta[property="og:image"]').attr("content") ?? "",
      source: "讀墨",
      sourceUrl: url,
    };
    return metadata;
  },
};

/** 讀墨作者/出版社後面會跟著「關注」按鈕的文字 */
function stripFollow(value: string): string {
  return value.replace(/\s*關注\s*$/, "").trim();
}

export function normalizeLanguage(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/繁體|正體|簡體|中文|chinese/i.test(value)) return "中文";
  if (/英文|english/i.test(value)) return "英文";
  if (/日文|japanese/i.test(value)) return "日文";
  return value;
}
