import { and, eq, ilike, inArray, ne, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { kinds } from "@/lib/db/schema/kinds";
import { works } from "@/lib/db/schema/works";
import { writings } from "@/lib/db/schema/writings";
import type { Linkable } from "@/types/record";

/** works／fragments 有各自的顯示欄位，片段還得挑 name 或 phrase——單字用 name，佳句用 phrase */
function fragmentLabel(row: { name: string; phrase: string }): string {
  return row.phrase || row.name;
}

/** 依關鍵字模糊搜三張表，排除自己。查詢卡片牆與 tag input 共用 */
export async function searchLinkables(
  userId: string,
  query: string,
  excludeId?: string,
): Promise<Linkable[]> {
  const pattern = `%${query}%`;

  const [workRows, fragmentRows, writingRows] = await Promise.all([
    db
      .select({ id: works.id, label: works.title, kindName: kinds.name })
      .from(works)
      .innerJoin(kinds, eq(kinds.id, works.kindId))
      .where(
        and(
          eq(works.userId, userId),
          ilike(works.title, pattern),
          excludeId ? ne(works.id, excludeId) : undefined,
        ),
      ),
    db
      .select({
        id: fragments.id,
        name: fragments.name,
        phrase: fragments.phrase,
        kindName: kinds.name,
      })
      .from(fragments)
      .innerJoin(kinds, eq(kinds.id, fragments.kindId))
      .where(
        and(
          eq(fragments.userId, userId),
          or(ilike(fragments.name, pattern), ilike(fragments.phrase, pattern)),
          excludeId ? ne(fragments.id, excludeId) : undefined,
        ),
      ),
    db
      .select({ id: writings.id, label: writings.name, kindName: kinds.name })
      .from(writings)
      .innerJoin(kinds, eq(kinds.id, writings.kindId))
      .where(
        and(
          eq(writings.userId, userId),
          ilike(writings.name, pattern),
          excludeId ? ne(writings.id, excludeId) : undefined,
        ),
      ),
  ]);

  const fragmentMatches = fragmentRows.map((row) => ({
    id: row.id,
    label: fragmentLabel(row),
    kindName: row.kindName,
  }));

  return [...workRows, ...fragmentMatches, ...writingRows];
}

/** 一批 id 各自屬於哪張表、顯示文字是什麼——連結完要秀 chip 時用 */
export async function linkablesByIds(
  userId: string,
  ids: string[],
): Promise<Map<string, Linkable>> {
  const map = new Map<string, Linkable>();
  if (!ids.length) return map;

  const [workRows, fragmentRows, writingRows] = await Promise.all([
    db
      .select({ id: works.id, label: works.title, kindName: kinds.name })
      .from(works)
      .innerJoin(kinds, eq(kinds.id, works.kindId))
      .where(and(eq(works.userId, userId), inArray(works.id, ids))),
    db
      .select({
        id: fragments.id,
        name: fragments.name,
        phrase: fragments.phrase,
        kindName: kinds.name,
      })
      .from(fragments)
      .innerJoin(kinds, eq(kinds.id, fragments.kindId))
      .where(and(eq(fragments.userId, userId), inArray(fragments.id, ids))),
    db
      .select({ id: writings.id, label: writings.name, kindName: kinds.name })
      .from(writings)
      .innerJoin(kinds, eq(kinds.id, writings.kindId))
      .where(and(eq(writings.userId, userId), inArray(writings.id, ids))),
  ]);

  for (const row of workRows) map.set(row.id, row);
  for (const row of fragmentRows)
    map.set(row.id, { id: row.id, label: fragmentLabel(row), kindName: row.kindName });
  for (const row of writingRows) map.set(row.id, row);

  return map;
}
