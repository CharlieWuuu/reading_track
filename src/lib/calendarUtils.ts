import { Book } from "@/types/book";
import { InstapaperBookmark } from "@/lib/instapaper/client";
import { isCompleted } from "@/lib/articleStats";

export interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
  books: Book[];
  articles: InstapaperBookmark[];
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function buildMonthGrid(
  year: number,
  month: number,
  books: Book[],
  articles: InstapaperBookmark[] = []
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

  const articlesByDay = new Map<string, InstapaperBookmark[]>();
  for (const a of articles) {
    if (!isCompleted(a)) continue;
    const timestamp = a.progress_timestamp || a.time;
    if (!timestamp) continue;
    const d = new Date(timestamp * 1000);
    if (Number.isNaN(d.getTime())) continue;
    const key = dateKey(d);
    const list = articlesByDay.get(key) ?? [];
    list.push(a);
    articlesByDay.set(key, list);
  }

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startWeekday);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
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
