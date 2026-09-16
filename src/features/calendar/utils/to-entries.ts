import { entryHref } from "@/config/routes";
import type { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
import type { TimelineItem } from "@/utils/timeline";
import type { DatedEntry } from "./calendar-utils";

/**
 * 紀錄與片段攤成月曆吃的形狀。
 *
 * 月曆只認 title／coverUrl／href，不認「這是書還是文章」——格子裡畫封面還是
 * 畫標題，看的是這一筆有沒有封面。所以這裡不分類型，兩張表只差在日期那一欄
 * 叫什麼，以及片段沒有完成日時退回建檔日。
 */

export function recordsToEntries(rows: readonly RecordRow[]): DatedEntry[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    coverUrl: row.coverUrl,
    href: entryHref(row.kindGroup, row.kindSlug, row),
    kindSlug: row.kindSlug,
    date: row.endDate,
  }));
}

export function fragmentsToEntries(rows: readonly FragmentRow[]): DatedEntry[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    coverUrl: row.coverUrl,
    href: entryHref(row.kindGroup, row.kindSlug, row),
    kindSlug: row.kindSlug,
    // 片段沒有完成日，建檔日就是它被記下來的那天
    date: row.date ?? row.createdAt.slice(0, 10),
  }));
}

/** 紀錄攤成數線吃的形狀。只有紀錄有開始日期，片段與書寫畫不出一段期間 */
export function recordsToTimeline(rows: readonly RecordRow[]): TimelineItem[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    startDate: row.startDate,
    endDate: row.endDate,
    href: entryHref(row.kindGroup, row.kindSlug, row),
  }));
}
