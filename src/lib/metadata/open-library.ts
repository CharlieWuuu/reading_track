import { normalizeIsbn } from "@/utils/isbn";
import { fetchJson } from "./http";
import { BookMetadata, Candidate, MetadataProvider } from "./types";

interface OpenLibraryDoc {
  title?: string;
  author_name?: string[];
  publisher?: string[];
  number_of_pages_median?: number;
  language?: string[];
  cover_i?: number;
  key?: string;
  isbn?: string[];
}

const LANGUAGE_NAMES: Record<string, string> = {
  chi: "中文",
  zho: "中文",
  eng: "英文",
  jpn: "日文",
};

const SEARCH_FIELDS = [
  "title",
  "author_name",
  "publisher",
  "number_of_pages_median",
  "language",
  "cover_i",
  "key",
  "isbn",
].join(",");

/**
 * 搜尋結果已經包含所有需要的欄位，所以先暫存起來，
 * fetchDetail 直接取用，不用為了同一本書再打一次 API。
 */
const cache = new Map<string, BookMetadata>();
const CACHE_LIMIT = 200;

function remember(url: string, metadata: BookMetadata) {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(url, metadata);
}

function toMetadata(doc: OpenLibraryDoc, url: string): BookMetadata {
  return {
    title: doc.title ?? "",
    author: doc.author_name?.join(", ") ?? "",
    publisher: doc.publisher?.[0] ?? "",
    pageCount: doc.number_of_pages_median ? String(doc.number_of_pages_median) : "",
    language: doc.language?.length ? (LANGUAGE_NAMES[doc.language[0]] ?? "") : "",
    // 一筆 work 底下所有版本的號碼都在這，13 碼優先（都是同一部作品的不同版本）
    isbn: normalizeIsbn(
      doc.isbn?.find((value) => normalizeIsbn(value).length === 13) ?? doc.isbn?.[0] ?? "",
    ),
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : "",
    source: "Open Library",
    sourceUrl: url,
  };
}

/**
 * Open Library 是完全開放的書目資料庫，不需要 API key、也沒有配額限制，
 * 主要用來補西文書的作者／出版社／頁數。
 */
export const openLibraryProvider: MetadataProvider = {
  name: "Open Library",

  findCandidates: async (query) => {
    const data = await fetchJson<{ docs?: OpenLibraryDoc[] }>(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(
        query,
      )}&limit=5&fields=${SEARCH_FIELDS}`,
    );
    if (!data?.docs?.length) return [];

    const candidates: Candidate[] = [];
    data.docs.forEach((doc, i) => {
      if (!doc.title) return;
      const url = doc.key ? `https://openlibrary.org${doc.key}` : `openlibrary:${query}:${i}`;
      remember(url, toMetadata(doc, url));
      candidates.push({ title: doc.title, url });
    });
    return candidates;
  },

  fetchDetail: async (url) => cache.get(url) ?? null,
};
