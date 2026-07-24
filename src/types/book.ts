export type BookPlatform =
  | "博客來"
  | "讀墨"
  | "Kobo"
  | "Kindle"
  | "Hyread"
  | "Pubu"
  | "其他";

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  coverUrl: string;
  publisher: string;
  platform: BookPlatform;
  sourceUrl: string;
  startDate: string | null;
  endDate: string | null;
  domain: string;
  type: string;
  language: string;
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
