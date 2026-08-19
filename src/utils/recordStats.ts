import { splitTags } from "@/types/book";
import { DistributionSlice, MonthCount } from "@/utils/bookStats";
import { parseDate } from "@/utils/date";

/**
 * 文章與紀事共用的統計。
 *
 * 兩邊的形狀一樣（一個日期加幾個分類欄），差別只在欄位叫什麼、單位是「篇」
 * 還是「筆」，所以算法只寫一份，各自傳進去要看的欄位。
 */
export type DatedRecord = { date: string | null };

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** 沒填日期的就是還沒完成，一律不計入統計 */
function dated<T extends DatedRecord>(records: T[]): { record: T; date: Date }[] {
  return (
    records
      // 不用 new Date()：日期欄可能帶時間（「2026-08-18 14:32」），那種字串各家瀏覽器解讀不一
      .map((record) => ({ record, date: parseDate(record.date) }))
      .filter((item): item is { record: T; date: Date } => Boolean(item.date && !isNaN(+item.date)))
  );
}

export function getRecordKpis<T extends DatedRecord>(records: T[]) {
  const done = dated(records);
  const now = new Date();
  const thisYear = done.filter((item) => item.date.getFullYear() === now.getFullYear()).length;

  return {
    completed: done.length,
    thisYear,
    // 今年到目前為止的節奏：今年筆數 ÷ 已經過完的月份數，跟書籍同一個算法
    avgPerMonth: Math.round((thisYear / (now.getMonth() + 1)) * 10) / 10,
  };
}

export function getRecordMonthlyTrend<T extends DatedRecord>(
  records: T[],
  monthsBack = 24,
): MonthCount[] {
  const counts = new Map<string, number>();

  const now = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    counts.set(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)), 0);
  }

  for (const { date } of dated(records)) {
    const key = monthKey(date);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()].map(([month, count]) => ({ month, count }));
}

/**
 * 某個欄位的分布。一格可以放多個值（屬性、關鍵字），每個各算一次，
 * 所以加總會大於筆數；整格空白的算「未分類」。
 */
export function getFieldDistribution<T extends DatedRecord>(
  records: T[],
  field: keyof T,
  { limit, includeBlank = true }: { limit?: number; includeBlank?: boolean } = {},
): DistributionSlice[] {
  const counts = new Map<string, number>();

  for (const { record } of dated(records)) {
    const values = splitTags(String(record[field] ?? ""));
    if (values.length === 0 && !includeBlank) continue;
    for (const name of values.length > 0 ? values : ["未分類"]) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }

  const slices = [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "zh-Hant"));

  return limit ? slices.slice(0, limit) : slices;
}
