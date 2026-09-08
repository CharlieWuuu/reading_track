import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { records, works } from "@/lib/db/schema/works";

/**
 * 某一種類型底下的紀錄。一列一次——同一個作品讀兩次就是兩列。
 *
 * 舊的 books／articles 還在各自的路由上跑，這一支只服務新表。
 * 兩套並存到資料搬完為止。
 */

export type RecordRow = {
  id: string;
  workId: string;
  title: string;
  creator: string;
  statusId: string;
  startDate: string | null;
  endDate: string | null;
  amount: number | null;
  amountUnit: string;
  source: string;
  coverUrl: string;
  isPrivate: boolean;
};

export async function listRecordsByKind(userId: string, kindId: string): Promise<RecordRow[]> {
  const rows = await db
    .select({ record: records, work: works })
    .from(records)
    .innerJoin(works, eq(works.id, records.workId))
    .where(and(eq(records.userId, userId), eq(works.kindId, kindId)))
    .orderBy(asc(records.createdAt));

  return rows.map(({ record, work }) => ({
    id: record.id,
    workId: work.id,
    title: work.title,
    creator: work.creator,
    statusId: record.statusId,
    startDate: record.startDate,
    endDate: record.endDate,
    amount: record.amount,
    amountUnit: record.amountUnit,
    source: record.source,
    coverUrl: record.coverUrl,
    isPrivate: record.isPrivate,
  }));
}
