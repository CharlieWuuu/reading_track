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
 * 首頁的「這個月」就是一個 range。
 */
export function itemsInRange<
  T extends { endDate?: string | null; startDate?: string | null; createdAt: string },
>(rows: readonly T[], range: DateRange): T[] {
  return rows.filter((row) => {
    const date = dateOf(row);
    return date >= range.start && date <= range.end;
  });
}

export function monthRange(date: string): DateRange {
  const month = date.slice(0, 7);
  return { start: `${month}-01`, end: `${month}-31` }; // 字串比大小，31 號不存在也框得住整個月
}
