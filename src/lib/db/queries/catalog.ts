import { and, asc, desc, eq } from "drizzle-orm";
import { KindGroup } from "@/config/record-kinds";
import { db } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { kinds, kindStatuses } from "@/lib/db/schema/kinds";
import { records, works } from "@/lib/db/schema/works";
import { sourceUrlOfFragment, sourceUrlOfRecord } from "./external-links";

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
    .select({ record: records, work: works, status: kindStatuses, kind: kinds })
    .from(records)
    .innerJoin(works, eq(works.id, records.workId))
    .innerJoin(kindStatuses, eq(kindStatuses.id, records.statusId))
    .innerJoin(kinds, eq(kinds.id, works.kindId))
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
    amountUnit: kind.amountUnit,
    source: work.source,
    coverUrl: work.coverUrl,
    isPrivate: record.isPrivate,
  }));
}

/** 整堆的紀錄。概覽頁要把同一堆底下所有類型混在一起排 */
export async function listRecordsByGroup(userId: string, group: KindGroup): Promise<RecordRow[]> {
  const rows = await db
    .select({ record: records, work: works, status: kindStatuses, kind: kinds })
    .from(records)
    .innerJoin(works, eq(works.id, records.workId))
    .innerJoin(kindStatuses, eq(kindStatuses.id, records.statusId))
    .innerJoin(kinds, eq(kinds.id, works.kindId))
    .where(and(eq(records.userId, userId), eq(kinds.groupKey, group)))
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
    amountUnit: kind.amountUnit,
    source: work.source,
    coverUrl: work.coverUrl,
    isPrivate: record.isPrivate,
  }));
}

export type FragmentRow = {
  id: string;
  kindId: string;
  kindName: string;
  workId: string | null;
  workTitle: string;
  name: string;
  body: string;
  locator: string;
  note: string;
  date: string | null;
  createdAt: string;
};

/**
 * 一堆片段（或專欄）。兩者形狀一樣，都在 fragments 表裡，靠類型屬於哪一堆分。
 *
 * 出處的標題一起帶出來——概覽上「這句話出自哪本書」比片段本身還重要。
 */
export async function listFragmentsByGroup(
  userId: string,
  group: KindGroup,
): Promise<FragmentRow[]> {
  const rows = await db
    .select({ fragment: fragments, kind: kinds, workTitle: works.title })
    .from(fragments)
    .innerJoin(kinds, eq(kinds.id, fragments.kindId))
    .leftJoin(works, eq(works.id, fragments.workId))
    .where(and(eq(fragments.userId, userId), eq(kinds.groupKey, group)))
    .orderBy(desc(fragments.createdAt));

  return rows.map(({ fragment, kind, workTitle }) => ({
    id: fragment.id,
    kindId: kind.id,
    kindName: kind.name,
    workId: fragment.workId,
    workTitle: workTitle ?? "",
    name: fragment.name,
    body: fragment.body,
    locator: fragment.locator,
    note: fragment.note,
    date: fragment.date,
    createdAt: fragment.createdAt.toISOString(),
  }));
}

/**
 * 單筆紀錄，回傳成「欄位 → 值」給表單用。
 *
 * 表單認的是欄位不是資料表，所以這裡把兩張表攤平成一份值——哪些畫出來由模組決定，
 * 這一層不管。
 */
export async function getRecordValues(
  userId: string,
  id: string,
): Promise<{ kindId: string; values: Record<string, string> } | null> {
  const [row] = await db
    .select({ record: records, work: works })
    .from(records)
    .innerJoin(works, eq(works.id, records.workId))
    .where(and(eq(records.userId, userId), eq(records.id, id)));
  if (!row) return null;

  const { record, work } = row;
  return {
    kindId: work.kindId,
    values: {
      title: work.title,
      creator: work.creator,
      language: work.language,
      startDate: record.startDate ?? "",
      endDate: record.endDate ?? "",
      amount: record.amount?.toString() ?? "",
      source: work.source,
      externalId: work.externalId,
      sourceUrl: await sourceUrlOfRecord(userId, id),
      coverUrl: work.coverUrl,
      isPrivate: record.isPrivate ? "是" : "",
    },
  };
}

/** 片段與專欄的單筆。欄位名跟紀錄那邊不一樣，攤平時一起對回模組認得的鍵 */
export async function getFragmentValues(
  userId: string,
  id: string,
): Promise<{ kindId: string; values: Record<string, string> } | null> {
  const [row] = await db
    .select()
    .from(fragments)
    .where(and(eq(fragments.userId, userId), eq(fragments.id, id)));
  if (!row) return null;

  return {
    kindId: row.kindId,
    values: {
      title: row.name,
      body: row.body,
      locator: row.locator,
      translation: row.translation,
      context: row.context,
      contextTranslation: row.contextTranslation,
      endDate: row.date ?? "",
      sourceUrl: await sourceUrlOfFragment(userId, id),
    },
  };
}
