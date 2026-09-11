import { and, eq, or } from "drizzle-orm";
import { type Tx } from "@/lib/db/client";
import { internalLinks } from "@/lib/db/schema/internal-links";

/**
 * 站內連結的寫入。a_id／b_id 不分方向，一個 id 連到另一個就是一列，不重複存兩筆。
 */

/** 兩個 id 之間建一條連結，已經連過就不重複插入 */
export async function link(tx: Tx, userId: string, aId: string, bId: string): Promise<void> {
  const [existing] = await tx
    .select({ id: internalLinks.id })
    .from(internalLinks)
    .where(
      and(
        eq(internalLinks.userId, userId),
        or(
          and(eq(internalLinks.aId, aId), eq(internalLinks.bId, bId)),
          and(eq(internalLinks.aId, bId), eq(internalLinks.bId, aId)),
        ),
      ),
    );
  if (existing) return;

  await tx.insert(internalLinks).values({ userId, aId, bId });
}

/** 某個 id 身上的連結整批換掉：先刪它跟誰連的，再照給的清單重建 */
export async function setLinks(
  tx: Tx,
  userId: string,
  id: string,
  otherIds: string[],
): Promise<void> {
  await tx
    .delete(internalLinks)
    .where(
      and(
        eq(internalLinks.userId, userId),
        or(eq(internalLinks.aId, id), eq(internalLinks.bId, id)),
      ),
    );
  for (const otherId of otherIds) await link(tx, userId, id, otherId);
}

/** 拆掉兩個 id 之間那一條連結，其他連結不動 */
export async function unlink(tx: Tx, userId: string, aId: string, bId: string): Promise<void> {
  await tx
    .delete(internalLinks)
    .where(
      and(
        eq(internalLinks.userId, userId),
        or(
          and(eq(internalLinks.aId, aId), eq(internalLinks.bId, bId)),
          and(eq(internalLinks.aId, bId), eq(internalLinks.bId, aId)),
        ),
      ),
    );
}

/** 拆掉某個 id 的所有連結，不留孤兒列。刪一筆資料本身時用 */
export async function unlinkAll(tx: Tx, userId: string, id: string): Promise<void> {
  await tx
    .delete(internalLinks)
    .where(
      and(
        eq(internalLinks.userId, userId),
        or(eq(internalLinks.aId, id), eq(internalLinks.bId, id)),
      ),
    );
}
