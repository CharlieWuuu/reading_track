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

export type YearStats = {
  count: number;
  pageTotal: number;
  pageAverage: number;
  thickest?: Book;
  fastest?: { book: Book; days: number };
};

function toPageCount(book: Book): number {
  const digits = book.pageCount.replace(/[,，\s]/g, "");
  return /^\d+$/.test(digits) ? Number(digits) : 0;
}

/** 花了幾天讀完：頭尾同一天也是讀了一天，不是零天 */
function daysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / 86400000) + 1;
}

/**
 * 右欄的統計數字：讀完的本數、頁數，加最厚、最快讀完各一本。
 * 不給年份就是總計——跟「今年」共用同一套算法，差別只在要不要先篩年份。
 */
export function getYearStats(books: Book[], year?: number): YearStats {
  const done = books.filter(
    (b) => b.status === "已讀完" && (year === undefined || b.endDate?.startsWith(String(year))),
  );

  const pageCounts = done.map((b) => ({ book: b, pages: toPageCount(b) }));
  const pageTotal = pageCounts.reduce((sum, { pages }) => sum + pages, 0);

  const thickest = [...pageCounts].sort((a, b) => b.pages - a.pages)[0];

  const fastest = done
    .filter((b) => b.startDate && b.endDate)
    .map((b) => ({ book: b, days: daysBetween(b.startDate!, b.endDate!) }))
    .filter(({ days }) => days >= 1)
    .sort((a, b) => a.days - b.days)[0];

  return {
    count: done.length,
    pageTotal,
    pageAverage: done.length > 0 ? Math.round(pageTotal / done.length) : 0,
    thickest: thickest && thickest.pages > 0 ? thickest.book : undefined,
    fastest,
  };
}
