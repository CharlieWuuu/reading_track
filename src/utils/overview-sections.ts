import { FragmentRow } from "@/lib/db/queries/catalog";
import { fragmentDate, recentBy } from "./home-digest";

/**
 * 概覽頁按類型分區的算式。純函式，畫面只負責排版。
 *
 * 概覽是摘要不是清單：每個類型只露幾筆，看完整的走「更多」進那個類型頁。
 * 這跟首頁「每個 group 一欄各三筆」是同一套想法，只是往下降一層。
 */

export const SECTION_SIZE = 4;

export type KindSection = {
  slug: string;
  name: string;
  total: number;
  rows: FragmentRow[];
};

/**
 * 照類型分區，每區取最近幾筆。
 *
 * 區的順序照「這個類型最近一筆有多新」——久沒動的類型自己沉下去，
 * 不用另外設排序欄位。同一份資料裡類型的原始順序不影響結果。

 */
export function sectionsByKind(
  rows: FragmentRow[],
  { take = SECTION_SIZE }: { take?: number } = {},
): KindSection[] {
  const byKind = rows.reduce((acc, row) => {
    const section = acc.get(row.kindSlug) ?? {
      slug: row.kindSlug,
      name: row.kindName,
      total: 0,
      rows: [] as FragmentRow[],
    };
    return acc.set(row.kindSlug, {
      ...section,
      total: section.total + 1,
      rows: [...section.rows, row],
    });
  }, new Map<string, KindSection>());

  return [...byKind.values()]
    .map((section) => ({ ...section, rows: recentBy(section.rows, fragmentDate, take) }))
    .sort((a, b) => latest(b).localeCompare(latest(a)));
}

const latest = (section: KindSection): string => fragmentDate(section.rows[0]) ?? "";
