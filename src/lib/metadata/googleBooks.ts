import { fetchJson } from "./http";
import { BookMetadata, Candidate, MetadataProvider } from "./types";

interface VolumeInfo {
  title?: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  pageCount?: number;
  language?: string;
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  infoLink?: string;
}

interface Volume {
  id?: string;
  volumeInfo?: VolumeInfo;
}

const LANGUAGE_NAMES: Record<string, string> = {
  ja: "日文",
  en: "英文",
  zh: "中文",
  "zh-TW": "中文",
  "zh-CN": "中文",
};

/** 搜尋結果就含全部欄位，先暫存讓 fetchDetail 直接取用，不用再打一次 API */
const cache = new Map<string, BookMetadata>();
const CACHE_LIMIT = 200;

function remember(url: string, metadata: BookMetadata) {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(url, metadata);
}

/** 縮圖網址預設是 http，直接用會被瀏覽器擋成混合內容 */
function toHttps(url: string): string {
  return url.replace(/^http:/, "https:");
}

function toMetadata(info: VolumeInfo, url: string): BookMetadata {
  const cover = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? "";
  return {
    title: info.title ?? "",
    author: info.authors?.join(", ") ?? "",
    publisher: info.publisher ?? "",
    pageCount: info.pageCount ? String(info.pageCount) : "",
    language: info.language ? LANGUAGE_NAMES[info.language] ?? "" : "",
    coverUrl: cover ? toHttps(cover) : "",
    source: "Google Books",
    sourceUrl: url,
  };
}

/**
 * Google Books 不需要 API key（未授權呼叫有速率限制，查不到就當作沒這個來源），
 * 是目前唯一同時涵蓋日文、英文、中文書的免費來源，日文書主要靠它。
 */
export const googleBooksProvider: MetadataProvider = {
  name: "Google Books",

  findCandidates: async (query) => {
    const data = await fetchJson<{ items?: Volume[] }>(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query
      )}&maxResults=5&printType=books`
    );
    if (!data?.items?.length) return [];

    const candidates: Candidate[] = [];
    data.items.forEach((item, i) => {
      const info = item.volumeInfo;
      if (!info?.title) return;
      const url = info.infoLink ?? `googlebooks:${item.id ?? `${query}:${i}`}`;
      remember(url, toMetadata(info, url));
      // 副標題分開放在 subtitle，比對書名時要接回去才對得上「主書名：副標」的寫法
      const full = info.subtitle ? `${info.title}：${info.subtitle}` : info.title;
      candidates.push({ title: full, url });
    });
    return candidates;
  },

  fetchDetail: async (url) => cache.get(url) ?? null,
};
