import { Book } from "@/types/book";

export interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
  books: Book[];
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function buildMonthGrid(year: number, month: number, books: Book[]): CalendarDay[] {
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

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startWeekday);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    days.push({
      date,
      inCurrentMonth: date.getMonth() === month,
      books: booksByDay.get(dateKey(date)) ?? [],
    });
  }

  return days;
}
