import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { internalLinks } from "@/lib/db/schema/internal-links";
import { kinds } from "@/lib/db/schema/kinds";

/**
 * 站內連結查詢。a_id／b_id 不分方向，查一筆東西跟誰有關要兩邊都看，
 * 對方是哪一個 id 由呼叫端自己判斷（排除掉查詢的那個 id 就是對方）。
 */

/** 跟某個 id 有關的所有連結，回傳對方的 id */
export async function linkedIdsOf(userId: string, id: string): Promise<string[]> {
  const rows = await db
    .select({ aId: internalLinks.aId, bId: internalLinks.bId })
    .from(internalLinks)
    .where(
      and(
        eq(internalLinks.userId, userId),
        or(eq(internalLinks.aId, id), eq(internalLinks.bId, id)),
      ),
    );

  return rows.map((row) => (row.aId === id ? row.bId : row.aId));
}

/** 批次查多個 id 的連結，列表頁用避免 N+1。回傳「id → 對方 id 陣列」 */
export async function linkedIdsOfMany(
  userId: string,
  ids: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!ids.length) return map;

  const idSet = new Set(ids);
  const rows = await db
    .select({ aId: internalLinks.aId, bId: internalLinks.bId })
    .from(internalLinks)
    .where(
      and(
        eq(internalLinks.userId, userId),
        or(inArray(internalLinks.aId, ids), inArray(internalLinks.bId, ids)),
      ),
    );

  for (const row of rows) {
    if (idSet.has(row.aId)) map.set(row.aId, [...(map.get(row.aId) ?? []), row.bId]);
    if (idSet.has(row.bId)) map.set(row.bId, [...(map.get(row.bId) ?? []), row.aId]);
  }
  return map;
}

/**
 * 一批東西（書、文章、書寫……）各自連到哪些關鍵字，回傳「id → 名字」。
 * 名字用換行接成一串是舊形狀，畫面上的 keywords 欄位吃這個。
 *
 * ownerId 名下可能還連著佳句、單字這些不相干的片段，靠 kind 過濾出真正的關鍵字——
 * 不然同名的單字混進來，畫面上會撞出重複的 key。
 */
export async function keywordNamesByOwner(
  userId: string,
  ownerIds: string[],
): Promise<Map<string, string>> {
  const linked = await linkedIdsOfMany(userId, ownerIds);
  const keywordIds = [...new Set([...linked.values()].flat())];
  if (!keywordIds.length) return new Map();

  const rows = await db
    .select({ id: fragments.id, name: fragments.name })
    .from(fragments)
    .innerJoin(kinds, eq(kinds.id, fragments.kindId))
    .where(
      and(
        eq(fragments.userId, userId),
        inArray(fragments.id, keywordIds),
        eq(kinds.name, "關鍵字"),
      ),
    );
  const nameById = new Map(rows.map((row) => [row.id, row.name]));

  const result = new Map<string, string>();
  for (const [ownerId, ids] of linked) {
    const names = ids.map((id) => nameById.get(id)).filter((name): name is string => Boolean(name));
    if (names.length)
      result.set(ownerId, [...names].sort((a, b) => a.localeCompare(b, "zh-Hant")).join("\n"));
  }
  return result;
}
