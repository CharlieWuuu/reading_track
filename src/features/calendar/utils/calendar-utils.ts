import { Article } from "@/types/article";
import { Book } from "@/types/book";
import { Writing } from "@/types/writing";

export interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
  books: Book[];
  articles: Article[];
  writings: Writing[];
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** 依日期分堆。日期空著或格式壞掉的落在月曆外面，直接跳過 */
function groupByDay<T>(items: T[], getDate: (item: T) => string | null): Map<string, T[]> {
  const byDay = new Map<string, T[]>();
  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) continue;
    const key = dateKey(date);
    byDay.set(key, [...(byDay.get(key) ?? []), item]);
  }
  return byDay;
}

/**
 * 三種東西共用同一張月曆：書與文章看「哪一天讀完」，紀事看「哪一天寫的」。
 *
 * 沒有合併成一個 entries 陣列，是因為畫法差很多——書有封面、文章是一條標題、
 * 紀事還有類型。合併之後每個地方都要再 switch 一次，不會比較短。
 */
export function buildMonthGrid(
  year: number,
  month: number,
  books: Book[],
  articles: Article[] = [],
  writings: Writing[] = [],
): CalendarDay[] {
  const booksByDay = groupByDay(books, (b) => b.endDate);
  const articlesByDay = groupByDay(articles, (a) => a.endDate);
  const writingsByDay = groupByDay(writings, (w) => w.date);

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startWeekday);

  // 只產出這個月實際跨到的週數（4～6 列），避免尾端多出一整列全是別月的灰格
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekCount = Math.ceil((startWeekday + daysInMonth) / 7);

  const days: CalendarDay[] = [];
  for (let i = 0; i < weekCount * 7; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const key = dateKey(date);
    days.push({
      date,
      inCurrentMonth: date.getMonth() === month,
      books: booksByDay.get(key) ?? [],
      articles: articlesByDay.get(key) ?? [],
      writings: writingsByDay.get(key) ?? [],
    });
  }

  return days;
}
