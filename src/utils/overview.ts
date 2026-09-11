import { Book, splitLines } from "@/types/book";

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

export type RailListItem = { id: string; title: string; meta: string };

/**
 * 右欄「出處排行」「關鍵字」共用的聚合：佳句、單字、關鍵字概覽頁都要從一批
 * 「掛在哪本書上」的條目，算出書籍排行榜、或這些書掛了哪些關鍵字的排行榜。
 * unit 只影響顯示（"則"／"個"），計數邏輯三頁完全一樣。
 *
 * bookIds 是攤平過的清單，一個元素記一次；同一筆條目在同一本書出現多次要不要去重
 * 由呼叫端決定（佳句一則只對一本書，天生不會重複；單字一詞可能在同一本書多次相遇，
 * 呼叫端要先用 Set 去重再傳進來，不然出處排行會把「相遇次數」算成「單字數」）。
 */
export function topBookSources(
  bookIds: readonly (string | undefined)[],
  books: readonly Book[],
  unit: string,
  limit = 5,
): RailListItem[] {
  const byId = new Map(books.map((book) => [book.id, book]));
  const counts = new Map<string, number>();
  for (const bookId of bookIds) {
    if (!bookId || !byId.has(bookId)) continue;
    counts.set(bookId, (counts.get(bookId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([bookId, count]) => ({
      id: bookId,
      title: byId.get(bookId)!.title,
      meta: `${count} ${unit}`,
    }));
}

export function topKeywordsFromBooks(
  bookIds: readonly (string | undefined)[],
  books: readonly Book[],
  unit: string,
  limit = 5,
): RailListItem[] {
  const byId = new Map(books.map((book) => [book.id, book]));
  const counts = new Map<string, number>();
  for (const bookId of bookIds) {
    const book = bookId ? byId.get(bookId) : undefined;
    if (!book) continue;
    for (const keyword of splitLines(book.keywords)) {
      counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ id: name, title: name, meta: `${count} ${unit}` }));
}
