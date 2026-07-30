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

export interface ProviderHints {
  /** 書在 Sheet 上標的語言，讓來源決定要不要接手（例：純漢字的日文書名） */
  language?: string;
}

export interface MetadataProvider {
  name: string;
  /**
   * 搜尋結果清單。查不到時回傳空陣列。
   * 只有「來源本身壞掉」（配額用完、被封鎖、連不上）才丟 SourceUnavailableError，
   * 那會被回報成來源問題，而不是「這本書查不到」。
   */
  findCandidates: (query: string, hints?: ProviderHints) => Promise<Candidate[]>;
  /** 讀取單一書籍頁的詳細資料 */
  fetchDetail: (url: string) => Promise<BookMetadata | null>;
}

export function isBlank(value: string | null | undefined) {
  return !value || !value.trim();
}

/**
 * 還沒補齊、而且「有機會補到」的欄位。
 *
 * 頁數與字數視為同一件事：電子書通路只給字數、圖書館書目只給頁數，
 * 沒有任何來源兩者都給。若把兩欄都當成必填，已經有字數的中文電子書
 * 會永遠停在「還缺頁數」，每次補齊都被重查一遍，把時間預算吃光，
 * 真正缺資料的書反而輪不到。
 */
export function missingFields(book: Book): EnrichableField[] {
  const hasLength = !isBlank(book.pageCount) || !isBlank(book.wordCount);
  return ENRICHABLE_FIELDS.filter((field) => {
    if (field === "pageCount" || field === "wordCount") return !hasLength;
    return isBlank(book[field]);
  });
}
