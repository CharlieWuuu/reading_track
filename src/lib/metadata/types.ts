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
  "isbn",
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
 * 頁數與字數各算各的：兩個一起有最好用（一個看厚度、一個看實際份量），
 * 而且 Pubu 的商品頁兩者都給得出來。代價是有些書（例如只查得到頁數的英文書）
 * 每次補齊都會為了那個永遠補不到的字數再跑一輪來源。
 */
export function missingFields(book: Book): EnrichableField[] {
  return ENRICHABLE_FIELDS.filter((field) => isBlank(book[field]));
}
