/** 月曆格子裡的一筆。哪一種類型都攤成這個形狀，月曆只認這個 */
export interface CalendarEntry {
  id: string;
  title: string;
  /** 有封面就在格子裡畫封面，沒有就畫一條標題——差別在這一欄，不在類型 */
  coverUrl: string;
  href: string;
  /** 配色跟著類型走，同一天有兩種類型才分得出來 */
  kindSlug: string;
}

export interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
  entries: CalendarEntry[];
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** 一筆資料加上它落在哪一天。日期由呼叫端決定要看完成日還是記下的那天 */
export type DatedEntry = CalendarEntry & { date: string | null };

/** 依日期分堆。日期空著或格式壞掉的落在月曆外面，直接跳過 */
function groupByDay(entries: readonly DatedEntry[]): Map<string, CalendarEntry[]> {
  const byDay = new Map<string, CalendarEntry[]>();
  for (const { date: raw, ...entry } of entries) {
    if (!raw) continue;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) continue;
    const key = dateKey(date);
    byDay.set(key, [...(byDay.get(key) ?? []), entry]);
  }
  return byDay;
}

/**
 * 任何類型共用同一張月曆。
 *
 * 原本收 books／articles／writings 三個具名陣列，各自一套畫法——開「影集」
 * 就得再加一個。改成一律攤成 entries：畫法的差別只有「有沒有封面」，
 * 那是一筆資料自己的屬性，不是它屬於哪一種類型。
 */
export function buildMonthGrid(
  year: number,
  month: number,
  entries: readonly DatedEntry[] = [],
): CalendarDay[] {
  const byDay = groupByDay(entries);

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
    days.push({
      date,
      inCurrentMonth: date.getMonth() === month,
      entries: byDay.get(dateKey(date)) ?? [],
    });
  }

  return days;
}
