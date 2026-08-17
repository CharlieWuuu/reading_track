import { Article } from "@/types/article";
import { Book } from "@/types/book";

export interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
  books: Book[];
  articles: Article[];
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function buildMonthGrid(
  year: number,
  month: number,
  books: Book[],
  articles: Article[] = [],
): CalendarDay[] {
  const booksByDay = new Map<string, Book[]>();
  for (const b of books) {
    if (!b.endDate) continue;
    const d = new Date(b.endDate);
    if (Number.isNaN(d.getTime())) continue;
    const key = dateKey(d);
    const list = booksByDay.get(key) ?? [];
    list.push(b);
    booksByDay.set(key, list);
  }

  const articlesByDay = new Map<string, Article[]>();
  for (const a of articles) {
    if (!a.endDate) continue;
    const d = new Date(a.endDate);
    if (Number.isNaN(d.getTime())) continue;
    const key = dateKey(d);
    const list = articlesByDay.get(key) ?? [];
    list.push(a);
    articlesByDay.set(key, list);
  }

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
    });
  }

  return days;
}
