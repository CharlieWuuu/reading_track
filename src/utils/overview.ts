/**
 * 概覽的分組。報紙式的版面要「一個頭條、其餘按月排」，
 * 所以這裡只做分組與挑選，畫法交給元件。
 *
 * 收的是攤平過的 OverviewItem 而不是 Book：紀錄那一頁要把書籍與文章混在一起排，
 * 之後電影、Podcast 也進同一份清單。誰轉成 item 由各自的 adapter 負責。
 */

export type OverviewItem = {
  id: string;
  title: string;
  /** 標題底下那行小字：創作者、主題、份量，已經接好的一串 */
  byline: string;
  href: string;
  coverUrl?: string;
  startDate?: string | null;
  endDate?: string | null;
  /** 混排時用來說明這是哪一種東西——同一頁裡書籍與電影要分得出來 */
  kindLabel?: string;
};

export type MonthGroup = {
  /** 顯示用的月份標題，例如 2025 · 08；沒填日期的這組不顯示標題文字（見 label 為空字串） */
  label: string;
  items: OverviewItem[];
};

const monthLabel = (date: string): string => `${date.slice(0, 4)} · ${date.slice(5, 7)}`;

/**
 * 照完成月份分組，新的在前。沒有完成日的項目不自成一組——沒有月份可言，
 * 混進第一組（有標題的最新月份），沒有月份資料時就自己是唯一一組、標題留空。
 */
export function byMonth(items: readonly OverviewItem[]): MonthGroup[] {
  const dated = items.filter((item) => item.endDate);
  const undated = items.filter((item) => !item.endDate);

  const groups = new Map<string, OverviewItem[]>();
  for (const item of dated) {
    const key = monthLabel(item.endDate!);
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }

  const result = [...groups].map(([label, list]) => ({ label, items: list }));
  if (undated.length === 0) return result;
  if (result.length === 0) return [{ label: "", items: undated }];

  result[0] = { ...result[0], items: [...result[0].items, ...undated] };
  return result;
}

/**
 * 頭條是「最近還在進行的那一件」。挑最近開始的，而不是清單的第一筆——
 * 清單第一筆是排序的結果，讀者關心的是自己現在在讀什麼。
 */
export function pickHeadline(active: readonly OverviewItem[]): OverviewItem | undefined {
  return [...active].sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))[0];
}
