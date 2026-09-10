// ISO 8601 週數：週一開始，一年的第一週是「包含該年第一個週四」的那一週

export type IsoWeek = { year: number; week: number };

function toUtcDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 週一開始的那個 UTC Date，時分秒歸零 */
function mondayOf(date: Date): Date {
  const day = date.getUTCDay() || 7; // 週日 getUTCDay() 是 0，改當作 7
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - day + 1);
  return monday;
}

/** 某天所在的 ISO 週。跨年時週數所屬的年份可能與曆年不同（例如 12/31 可能是隔年第 1 週） */
export function isoWeekOf(date: string): IsoWeek {
  const monday = mondayOf(toUtcDate(date));
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const year = thursday.getUTCFullYear();
  const firstThursday = mondayOf(new Date(Date.UTC(year, 0, 4)));
  const week = Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 86400000)) + 1;
  return { year, week };
}

/** 該 ISO 週的週一到週日，含頭含尾 */
export function isoWeekRange(isoWeek: IsoWeek): { start: string; end: string } {
  const jan4 = new Date(Date.UTC(isoWeek.year, 0, 4));
  const firstMonday = mondayOf(jan4);
  const start = new Date(firstMonday);
  start.setUTCDate(firstMonday.getUTCDate() + (isoWeek.week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start: fromUtcDate(start), end: fromUtcDate(end) };
}

export function previousIsoWeek({ year, week }: IsoWeek): IsoWeek {
  const { start } = isoWeekRange({ year, week });
  const monday = toUtcDate(start);
  monday.setUTCDate(monday.getUTCDate() - 7);
  return isoWeekOf(fromUtcDate(monday));
}

export function nextIsoWeek({ year, week }: IsoWeek): IsoWeek {
  const { start } = isoWeekRange({ year, week });
  const monday = toUtcDate(start);
  monday.setUTCDate(monday.getUTCDate() + 7);
  return isoWeekOf(fromUtcDate(monday));
}

/** 篩選某週範圍內的日期字串（含頭含尾） */
export function isInIsoWeek(date: string, isoWeek: IsoWeek): boolean {
  const { start, end } = isoWeekRange(isoWeek);
  return date >= start && date <= end;
}
