// ISO 8601 週數：週一開始，一年的第一週是「包含該年第一個週四」的那一週

export type IsoWeek = { year: number; week: number };

function toUtcDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
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
