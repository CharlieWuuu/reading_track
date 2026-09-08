import { and, eq } from "drizzle-orm";
import { type Tx } from "@/lib/db/client";
import { externalLinks } from "@/lib/db/schema/external-links";

/**
 * 外部連結寫入。records（書籍／文章）與 fragments（佳句／單字／關鍵字／書寫）
 * 共用同一張表，靠 source_type 分。
 *
 * 應用層目前只維護單一連結（表單一個網址欄），所以這裡整批換掉而不是逐筆對——
 * 有值就留一筆，沒值就清空，跟舊欄位語意一樣。
 * 一律用 tx，跟主體的其他寫入包在同一個交易裡。
 */

type SourceType = "record" | "fragment";

async function setSourceUrl(
  tx: Tx,
  userId: string,
  sourceType: SourceType,
  sourceId: string,
  url: string | undefined,
): Promise<void> {
  const trimmed = url?.trim() ?? "";

  await tx
    .delete(externalLinks)
    .where(
      and(
        eq(externalLinks.userId, userId),
        eq(externalLinks.sourceType, sourceType),
        eq(externalLinks.sourceId, sourceId),
      ),
    );

  if (trimmed) {
    await tx.insert(externalLinks).values({
      userId,
      sourceType,
      sourceId,
      url: trimmed,
    });
  }
}

export const setRecordSourceUrl = (
  tx: Tx,
  userId: string,
  recordId: string,
  url: string | undefined,
): Promise<void> => setSourceUrl(tx, userId, "record", recordId, url);

export const setFragmentSourceUrl = (
  tx: Tx,
  userId: string,
  fragmentId: string,
  url: string | undefined,
): Promise<void> => setSourceUrl(tx, userId, "fragment", fragmentId, url);
