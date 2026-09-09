import { and, eq } from "drizzle-orm";
import { type Tx } from "@/lib/db/client";
import { externalLinks } from "@/lib/db/schema/external-links";

/**
 * 外部連結寫入。records（書籍／文章）、fragments（佳句／單字／關鍵字）、
 * writings（書寫）共用同一張表，靠 record_id／fragment_id／writing_id 三個外鍵分。
 *
 * 應用層目前只維護單一連結（表單一個網址欄），所以這裡整批換掉而不是逐筆對——
 * 有值就留一筆，沒值就清空，跟舊欄位語意一樣。
 * 一律用 tx，跟主體的其他寫入包在同一個交易裡。
 */

async function setSourceUrl(
  tx: Tx,
  userId: string,
  column:
    | typeof externalLinks.recordId
    | typeof externalLinks.fragmentId
    | typeof externalLinks.writingId,
  sourceId: string,
  url: string | undefined,
  values: { recordId?: string; fragmentId?: string; writingId?: string },
): Promise<void> {
  const trimmed = url?.trim() ?? "";

  await tx.delete(externalLinks).where(and(eq(externalLinks.userId, userId), eq(column, sourceId)));

  if (trimmed) {
    await tx.insert(externalLinks).values({ userId, url: trimmed, ...values });
  }
}

export const setRecordSourceUrl = (
  tx: Tx,
  userId: string,
  recordId: string,
  url: string | undefined,
): Promise<void> => setSourceUrl(tx, userId, externalLinks.recordId, recordId, url, { recordId });

export const setFragmentSourceUrl = (
  tx: Tx,
  userId: string,
  fragmentId: string,
  url: string | undefined,
): Promise<void> =>
  setSourceUrl(tx, userId, externalLinks.fragmentId, fragmentId, url, { fragmentId });

export const setWritingSourceUrl = (
  tx: Tx,
  userId: string,
  writingId: string,
  url: string | undefined,
): Promise<void> =>
  setSourceUrl(tx, userId, externalLinks.writingId, writingId, url, { writingId });
