import type { Book } from "@/types/book";

/** 測試用的一本書。全部欄位都是空字串，要測什麼就蓋什麼 */
export function makeBook(patch: Partial<Book> = {}): Book {
  return {
    id: crypto.randomUUID(),
    title: "資本論",
    author: "馬克思",
    publisher: "",
    language: "中文",
    domain: "人文社科",
    subDomain: "歷史",
    type: "散文",
    platform: "",
    isbn: "",
    sourceUrl: "",
    coverUrl: "",
    pageCount: "",
    wordCount: "",
    status: "想讀",
    startDate: "",
    endDate: "",
    keywords: "",
    private: "",
    originId: "",
    note: "",
    quotes: "",
    vocabulary: "",
    relatedArticles: "",
    ...patch,
  };
}
