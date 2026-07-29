import { Book } from "@/types/book";

/** 可以被自動補齊的欄位。刻意不含日期／分類等只有使用者知道的資訊。 */
export const ENRICHABLE_FIELDS = [
  "title",
  "author",
  "publisher",
  "coverUrl",
  "language",
  "pageCount",
  "wordCount",
] as const;

export type EnrichableField = (typeof ENRICHABLE_FIELDS)[number];

export type BookMetadata = Partial<Record<EnrichableField, string>> & {
  /** 查到這筆資料的來源，方便在畫面上說明「資料來自讀墨」 */
  source?: string;
  sourceUrl?: string;
};

export interface Candidate {
  title: string;
  url: string;
}

export interface MetadataProvider {
  name: string;
  /** 搜尋結果清單。查不到時回傳空陣列，不要 throw。 */
  findCandidates: (query: string) => Promise<Candidate[]>;
  /** 讀取單一書籍頁的詳細資料 */
  fetchDetail: (url: string) => Promise<BookMetadata | null>;
}

export function isBlank(value: string | null | undefined) {
  return !value || !value.trim();
}

export function missingFields(book: Book): EnrichableField[] {
  return ENRICHABLE_FIELDS.filter((field) => isBlank(book[field]));
}
