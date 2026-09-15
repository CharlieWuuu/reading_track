import { and, asc, eq, inArray, or } from "drizzle-orm";
import { db as defaultDb, type Tx } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { internalLinks } from "@/lib/db/schema/internal-links";
import { kinds } from "@/lib/db/schema/kinds";
import { works } from "@/lib/db/schema/works";

/**
 * 站內連結查詢。a_id／b_id 不分方向，查一筆東西跟誰有關要兩邊都看，
 * 對方是哪一個 id 由呼叫端自己判斷（排除掉查詢的那個 id 就是對方）。
 *
 * 兩支都接受可選的 tx：mutation 那邊在交易裡查完馬上要寫，若用外層的 db
 * 開一條新連線，跟交易鎖的同一批列互等，會卡死（addWritingRow 那批測試
 * 曾經因此全部 timeout）。呼叫端在交易內就把 tx 傳進來，走同一條連線。
 */

/** 跟某個 id 有關的所有連結，回傳對方的 id */
export async function linkedIdsOf(
  userId: string,
  id: string,
  tx: Tx | typeof defaultDb = defaultDb,
): Promise<string[]> {
  const rows = await tx
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
  tx: Tx | typeof defaultDb = defaultDb,
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!ids.length) return map;

  const idSet = new Set(ids);
  const rows = await tx
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

  const rows = await defaultDb
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

/** 一則書寫延伸自哪個作品：作品編號、標題、它自己的類型名、封面 */
export type LinkedWork = {
  id: string;
  title: string;
  kindName: string;
  coverUrl: string;
};

/**
 * 一批書寫各自連到哪個作品，回傳「書寫 id → 那個作品」。
 *
 * 出處原本是 domain_writings.work_id 單獨一欄，關聯搬進 links_internal 之後
 * 改從這裡查。名下也可能連著關鍵字、佳句那些片段，join works 就篩掉了——
 * 只有作品那張表才有東西對得上。
 *
 * 連到多個作品時取建立最早的那一個：畫面上的「延伸自」是一格，
 * 而 work_id 時代本來就只存得下一個，取最早的跟舊行為對得起來。
 */
export async function sourceWorkOfWritings(
  userId: string,
  writingIds: string[],
): Promise<Map<string, LinkedWork>> {
  const linked = await linkedIdsOfMany(userId, writingIds);
  const workIds = [...new Set([...linked.values()].flat())];
  if (!workIds.length) return new Map();

  const rows = await defaultDb
    .select({
      id: works.id,
      title: works.title,
      kindName: kinds.name,
      coverUrl: works.coverUrl,
      createdAt: works.createdAt,
    })
    .from(works)
    .innerJoin(kinds, eq(kinds.id, works.kindId))
    .where(and(eq(works.userId, userId), inArray(works.id, workIds)))
    .orderBy(asc(works.createdAt));

  // 照建立時間排名次，多個作品時挑得出最早的那一個。
  // ids 是關聯的順序，直接取第一個拿到的會是「最早連上的」，不是最早建立的
  const rankById = new Map(rows.map((row, index) => [row.id, index]));
  const workById = new Map(rows.map((row) => [row.id, row]));
  const result = new Map<string, LinkedWork>();
  for (const [writingId, ids] of linked) {
    const found = ids
      .filter((id) => rankById.has(id))
      .sort((a, b) => rankById.get(a)! - rankById.get(b)!)
      .map((id) => workById.get(id))[0];
    if (found)
      result.set(writingId, {
        id: found.id,
        title: found.title,
        kindName: found.kindName,
        coverUrl: found.coverUrl ?? "",
      });
  }
  return result;
}
