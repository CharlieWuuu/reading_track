export type BookPlatform =
  | "博客來"
  | "讀墨"
  | "Kobo"
  | "Kindle"
  | "Hyread"
  | "Pubu"
  | "實體書"
  | "其他";

export const BOOK_PLATFORMS: BookPlatform[] = [
  "博客來",
  "讀墨",
  "Kobo",
  "Kindle",
  "Hyread",
  "Pubu",
  "實體書",
  "其他",
];

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  publisher: string;
  platform: BookPlatform;
  sourceUrl: string;
  startDate: string | null;
  endDate: string | null;
  domain: string;
  type: string;
  language: string;
  /** 紙本／電子書頁數，以字串保存，方便使用者直接在 Sheet 編輯 */
  pageCount: string;
  /** 電子書常見的總字數 */
  wordCount: string;
  note: string;
}

export interface BookCategories {
  domain: string[];
  type: string[];
  language: string[];
}

export const DEFAULT_CATEGORIES: BookCategories = {
  domain: ["社會科學", "文學", "語言學", "歷史", "科普", "商業"],
  type: ["工具書", "小說", "散文", "詩", "傳記"],
  language: ["中文", "英文", "日文", "台文"],
};
