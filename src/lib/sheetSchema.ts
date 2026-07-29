import { Book } from "@/types/book";

export type BookField = keyof Book;

/**
 * Sheet 欄位一律以中文為主，讓使用者可以直接打開 Google Sheet 編輯。
 * 舊版英文欄名（以及常見的別名）仍然讀得到，不需要手動改表。
 */
export const COLUMN_LABELS: Record<BookField, string> = {
  id: "編號",
  title: "書名",
  author: "作者",
  coverUrl: "封面網址",
  publisher: "出版社",
  platform: "平台",
  sourceUrl: "來源網址",
  startDate: "開始日期",
  endDate: "完成日期",
  domain: "領域",
  type: "屬性",
  language: "語言",
  pageCount: "頁數",
  wordCount: "字數",
  note: "筆記",
};

export const BOOK_FIELDS = Object.keys(COLUMN_LABELS) as BookField[];

/** 中文欄名以外，也接受的舊欄名／別名（比對時忽略大小寫與空白）。 */
const COLUMN_ALIASES: Record<BookField, string[]> = {
  id: ["id", "uuid", "識別碼"],
  title: ["title", "書名", "標題", "書籍名稱"],
  author: ["author", "authors", "作者", "譯者作者"],
  coverUrl: ["coverurl", "cover", "封面", "封面網址", "封面url"],
  publisher: ["publisher", "出版社", "出版商"],
  platform: ["platform", "平台", "來源平台"],
  sourceUrl: ["sourceurl", "url", "來源網址", "連結", "網址"],
  startDate: ["startdate", "開始日期", "開始", "起始日期"],
  endDate: ["enddate", "完成日期", "結束日期", "讀完日期"],
  domain: ["domain", "領域", "分類"],
  type: ["type", "屬性", "類型"],
  language: ["language", "語言", "語系"],
  pageCount: ["pagecount", "pages", "頁數", "總頁數"],
  wordCount: ["wordcount", "words", "字數", "總字數"],
  note: ["note", "notes", "筆記", "備註", "心得"],
};

function normalize(header: string) {
  return header.replace(/\s+/g, "").toLowerCase();
}

/**
 * 把實際表頭對應回程式欄位。回傳 field -> 實際表頭字串，
 * 讓讀寫都用使用者當下的欄名，不會因為改成中文就找不到舊資料。
 */
export function mapHeaders(headers: string[]): Partial<Record<BookField, string>> {
  const map: Partial<Record<BookField, string>> = {};
  for (const field of BOOK_FIELDS) {
    const aliases = COLUMN_ALIASES[field].map(normalize);
    const match = headers.find((h) => aliases.includes(normalize(h)));
    if (match) map[field] = match;
  }
  return map;
}

/** 表頭沒對應到任何已知欄位的欄，視為使用者自訂欄位，保留不動。 */
export function unknownHeaders(headers: string[]): string[] {
  const known = new Set(Object.values(mapHeaders(headers)));
  return headers.filter((h) => h.trim() && !known.has(h));
}
