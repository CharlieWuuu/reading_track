import { Book } from "@/types/book";

/**
 * 概覽的分組。報紙式的版面要「一個頭條、其餘按月排」，
 * 所以這裡只做分組與挑選，畫法交給元件。
 */

export type MonthGroup = {
  /** 顯示用的月份標題，例如 2025 · 08 */
  label: string;
  books: Book[];
};

const monthLabel = (date: string): string => `${date.slice(0, 4)} · ${date.slice(5, 7)}`;

/** 讀完的書照完成月份分組，新的在前。沒有完成日的歸到最後一組 */
export function byMonth(books: Book[]): MonthGroup[] {
  const groups = new Map<string, Book[]>();
  for (const book of books) {
    const key = book.endDate ? monthLabel(book.endDate) : "沒寫日期";
    const bucket = groups.get(key);
    if (bucket) bucket.push(book);
    else groups.set(key, [book]);
  }
  return [...groups].map(([label, list]) => ({ label, books: list }));
}

/**
 * 頭條是「最近還在讀的那一本」。挑最近開始的，而不是清單的第一本——
 * 清單第一本是排序的結果，讀者關心的是自己現在在讀什麼。
 */
export function pickHeadline(reading: Book[]): Book | undefined {
  return [...reading].sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))[0];
}
