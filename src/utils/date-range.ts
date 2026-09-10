export type DateRange = { start: string; end: string };

function dateOf(row: {
  endDate?: string | null;
  startDate?: string | null;
  createdAt: string;
}): string {
  return row.endDate ?? row.startDate ?? row.createdAt.slice(0, 10);
}

/**
 * 一筆紀錄算進哪個範圍，看「什麼時候發生」優先於「什麼時候建的」——
 * 完成日 > 開始日 > 建立時間，全都沒有才落到最後一層。
 *
 * 年報、週報、日報都是同一件事的不同粒度，差在算出來的 range 多長。
 */
export function itemsInRange<
  T extends { endDate?: string | null; startDate?: string | null; createdAt: string },
>(rows: readonly T[], range: DateRange): T[] {
  return rows.filter((row) => {
    const date = dateOf(row);
    return date >= range.start && date <= range.end;
  });
}

export function yearRange(year: number): DateRange {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function dayRange(date: string): DateRange {
  return { start: date, end: date };
}
