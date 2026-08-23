import { Book } from "@/types/book";

/** 一本書在數線上佔的期間。日期只留年月日，帶時分秒去比較會多算一天 */
export interface Span {
  book: Book;
  start: Date;
  end: Date;
  /** 還沒讀完：線畫到今天，但尾端不封口 */
  ongoing: boolean;
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function parseDay(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : startOfDay(date);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

/**
 * 兩個日期都沒有的書畫不出期間，直接跳過。
 * 只有讀完日期的當成那一天的一個點；還在讀的畫到今天為止。
 */
export function toSpans(books: Book[], today: Date): Span[] {
  const now = startOfDay(today);
  return books.flatMap((book) => {
    const finished = parseDay(book.endDate);
    const start = parseDay(book.startDate) ?? finished;
    if (!start) return [];
    const end = finished ?? now;
    // 資料打錯（完成早於開始）就當成一天，不要畫出負寬度
    return [{ book, start, end: end < start ? start : end, ongoing: !finished }];
  });
}

/** 一段期間本身有幾天（含頭尾） */
export function spanDays(span: Span): number {
  return daysBetween(span.start, span.end) + 1;
}

/**
 * 排成幾列，同一列裡的東西畫出來不會疊到。長的排上面，短的塞進上面剩下的空隙。
 *
 * 佔多寬由 `extent` 決定，不是期間長度：書名寫在線的左端往右延伸，
 * 讀一天的書線只有幾個像素、書名卻有好幾個字，只看期間會讓兩個書名疊在一起。
 */
export function packLanes(spans: Span[], extent: (span: Span) => number = spanDays): Span[][] {
  const sorted = [...spans].sort(
    (a, b) => extent(b) - extent(a) || a.start.getTime() - b.start.getTime(),
  );

  const lanes: Span[][] = [];
  for (const span of sorted) {
    const from = daysBetween(sorted[0].start, span.start);
    const to = from + extent(span);
    const lane = lanes.find((row) =>
      row.every((other) => {
        const otherFrom = daysBetween(sorted[0].start, other.start);
        return to <= otherFrom || from >= otherFrom + extent(other);
      }),
    );
    if (lane) lane.push(span);
    else lanes.push([span]);
  }
  return lanes;
}

/** 數線要涵蓋的日期範圍。沒有任何期間時回 null，畫面改顯示「還沒有資料」 */
export function spanRange(spans: Span[]): { from: Date; to: Date } | null {
  if (spans.length === 0) return null;
  return {
    from: spans.reduce((min, s) => (s.start < min ? s.start : min), spans[0].start),
    to: spans.reduce((max, s) => (s.end > max ? s.end : max), spans[0].end),
  };
}

export interface MonthTick {
  /** 這個月從範圍起點算起的第幾天 */
  offset: number;
  days: number;
  label: string;
  /** 一月才寫年份，其餘只寫月：整條軸上重複寫年份很吵 */
  year: number | null;
}

/** 軸上的月份刻度。頭尾兩個月只算落在範圍內的天數，格子寬度才對得上 */
export function monthTicks(from: Date, to: Date): MonthTick[] {
  const ticks: MonthTick[] = [];
  let cursor = new Date(from.getFullYear(), from.getMonth(), 1);

  while (cursor <= to) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const start = cursor < from ? from : cursor;
    const end = next > to ? addDays(to, 1) : next;
    ticks.push({
      offset: daysBetween(from, start),
      days: daysBetween(start, end),
      label: `${cursor.getMonth() + 1} 月`,
      year: cursor.getMonth() === 0 || ticks.length === 0 ? cursor.getFullYear() : null,
    });
    cursor = next;
  }
  return ticks;
}
