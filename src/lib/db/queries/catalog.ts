import { and, asc, eq } from "drizzle-orm";
import { KindGroup } from "@/config/record-kinds";
import { db } from "@/lib/db/client";
import { recordKinds, recordKindStatuses } from "@/lib/db/schema/kinds";
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
  statusKey: string;
  kindId: string;
  kindName: string;
  startDate: string | null;
  endDate: string | null;
  amount: number | null;
  amountUnit: string;
  source: string;
  coverUrl: string;
  isPrivate: boolean;
};

/** kindId 不給就是整堆都要——概覽頁要把書籍與文章混在一起排 */
export async function listRecordsByKind(userId: string, kindId?: string): Promise<RecordRow[]> {
  const rows = await db
    .select({ record: records, work: works, status: recordKindStatuses, kind: recordKinds })
    .from(records)
    .innerJoin(works, eq(works.id, records.workId))
    .innerJoin(recordKindStatuses, eq(recordKindStatuses.id, records.statusId))
    .innerJoin(recordKinds, eq(recordKinds.id, works.kindId))
    .where(and(eq(records.userId, userId), kindId ? eq(works.kindId, kindId) : undefined))
    .orderBy(asc(records.createdAt));

  return rows.map(({ record, work, status, kind }) => ({
    id: record.id,
    workId: work.id,
    title: work.title,
    creator: work.creator,
    statusId: record.statusId,
    statusKey: status.key,
    kindId: kind.id,
    kindName: kind.name,
    startDate: record.startDate,
    endDate: record.endDate,
    amount: record.amount,
    amountUnit: record.amountUnit,
    source: record.source,
    coverUrl: record.coverUrl,
    isPrivate: record.isPrivate,
  }));
}

/** 整堆的紀錄。概覽頁要把同一堆底下所有類型混在一起排 */
export async function listRecordsByGroup(userId: string, group: KindGroup): Promise<RecordRow[]> {
  const rows = await db
    .select({ record: records, work: works, status: recordKindStatuses, kind: recordKinds })
    .from(records)
    .innerJoin(works, eq(works.id, records.workId))
    .innerJoin(recordKindStatuses, eq(recordKindStatuses.id, records.statusId))
    .innerJoin(recordKinds, eq(recordKinds.id, works.kindId))
    .where(and(eq(records.userId, userId), eq(recordKinds.groupKey, group)))
    .orderBy(asc(records.createdAt));

  return rows.map(({ record, work, status, kind }) => ({
    id: record.id,
    workId: work.id,
    title: work.title,
    creator: work.creator,
    statusId: record.statusId,
    statusKey: status.key,
    kindId: kind.id,
    kindName: kind.name,
    startDate: record.startDate,
    endDate: record.endDate,
    amount: record.amount,
    amountUnit: record.amountUnit,
    source: record.source,
    coverUrl: record.coverUrl,
    isPrivate: record.isPrivate,
  }));
}
