import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { KindGroup } from "@/config/record-kinds";
import { db } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { kinds } from "@/lib/db/schema/kinds";
import { attributes, recordTopics } from "@/lib/db/schema/taxonomy";
import { records, works } from "@/lib/db/schema/works";
import { writings } from "@/lib/db/schema/writings";
import { inferStatusKey } from "@/types/book";
import { decodeCursor, encodeCursor } from "@/utils/pagination";
import { byDateThenNewest } from "@/utils/record-order";
import { sourceUrlOfFragment, sourceUrlOfRecord } from "./external-links";
import { worksOfFragments } from "./fragments";
import { listWritings } from "./writings";

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
  statusKey: string;
  kindId: string;
  kindName: string;
  /** 個數單位，空的就退回「筆」 */
  kindCountUnit: string;
  kindGroup: KindGroup;
  kindSlug: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  amount: number | null;
  amountUnit: string;
  source: string;
  coverUrl: string;
  isPrivate: boolean;
};

const toRecordRow = ({
  record,
  work,
  kind,
}: {
  record: typeof records.$inferSelect;
  work: typeof works.$inferSelect;
  kind: typeof kinds.$inferSelect;
}): RecordRow => ({
  id: record.id,
  workId: work.id,
  title: work.title,
  creator: work.creator,
  statusKey: inferStatusKey(record.startDate, record.endDate),
  kindId: kind.id,
  kindName: kind.name,
  kindCountUnit: kind.countUnit,
  kindGroup: kind.groupKey as KindGroup,
  kindSlug: kind.slug,
  startDate: record.startDate,
  endDate: record.endDate,
  createdAt: record.createdAt.toISOString(),
  amount: work.amount,
  amountUnit: kind.amountUnit,
  source: work.source,
  coverUrl: work.coverUrl,
  isPrivate: record.isPrivate,
});

/** kindId 不給就是整個 group 都要——概覽頁要把書籍與文章混在一起排 */
export async function listRecordsByKind(userId: string, kindId?: string): Promise<RecordRow[]> {
  const rows = await db
    .select({ record: records, work: works, kind: kinds })
    .from(records)
    .innerJoin(works, eq(works.id, records.workId))
    .innerJoin(kinds, eq(kinds.id, works.kindId))
    .where(and(eq(records.userId, userId), kindId ? eq(works.kindId, kindId) : undefined))
    .orderBy(asc(records.createdAt));

  return rows.map(toRecordRow);
}

/** 整個 group 的紀錄。概覽頁要把同一個 group 底下所有類型混在一起排 */
export async function listRecordsByGroup(userId: string, group: KindGroup): Promise<RecordRow[]> {
  const rows = await db
    .select({ record: records, work: works, kind: kinds })
    .from(records)
    .innerJoin(works, eq(works.id, records.workId))
    .innerJoin(kinds, eq(kinds.id, works.kindId))
    .where(and(eq(records.userId, userId), eq(kinds.groupKey, group)))
    .orderBy(asc(records.createdAt));

  return rows.map(toRecordRow);
}

/**
 * 進行中／想要那兩堆，概覽頁右欄與頭條用。這批天生就小（同時在讀的書不會太多），
 * 整批抓，不分頁——分頁只留給會一直長大的「完成」那個 group。
 */
export async function listActiveRecordsByGroup(
  userId: string,
  group: KindGroup,
): Promise<RecordRow[]> {
  const rows = await db
    .select({ record: records, work: works, kind: kinds })
    .from(records)
    .innerJoin(works, eq(works.id, records.workId))
    .innerJoin(kinds, eq(kinds.id, works.kindId))
    .where(and(eq(records.userId, userId), eq(kinds.groupKey, group), isNull(records.endDate)))
    .orderBy(asc(records.createdAt));

  return rows.map(toRecordRow);
}

type DoneCursor = { endDate: string; id: string };

export type PagedRecordRows = {
  rows: RecordRow[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
};

/**
 * 完成的那個 group，keyset 分頁。畫面照 endDate 新到舊排（跟 records-overview.tsx
 * 原本在前端做的 sort 同一個鍵），游標也用 (endDate, id) 而不是 createdAt，
 * 兩者本來就是不同欄位，分頁鍵要跟顯示排序鍵一致，不然翻頁順序會跟畫面對不起來。
 */
export async function listDoneRecordsByGroup(
  userId: string,
  group: KindGroup,
  { cursor, limit }: { cursor?: string | null; limit: number },
): Promise<PagedRecordRows> {
  const after = decodeCursor<DoneCursor>(cursor);

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({ record: records, work: works, kind: kinds })
      .from(records)
      .innerJoin(works, eq(works.id, records.workId))
      .innerJoin(kinds, eq(kinds.id, works.kindId))
      .where(
        and(
          eq(records.userId, userId),
          eq(kinds.groupKey, group),
          isNotNull(records.endDate),
          after
            ? sql`(${records.endDate}, ${records.id}) < (${after.endDate}, ${after.id})`
            : undefined,
        ),
      )
      .orderBy(desc(records.endDate), desc(records.id))
      .limit(limit + 1),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(records)
      .innerJoin(works, eq(works.id, records.workId))
      .innerJoin(kinds, eq(kinds.id, works.kindId))
      .where(
        and(eq(records.userId, userId), eq(kinds.groupKey, group), isNotNull(records.endDate)),
      ),
  ]);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);
  const nextCursor =
    hasMore && last
      ? encodeCursor({ endDate: last.record.endDate!, id: last.record.id } satisfies DoneCursor)
      : null;

  return { rows: page.map(toRecordRow), nextCursor, hasMore, total: count };
}

export type FragmentRow = {
  id: string;
  kindId: string;
  kindName: string;
  /** 個數單位，空的就退回「筆」 */
  kindCountUnit: string;
  kindGroup: KindGroup;
  kindSlug: string;
  workId: string | null;
  workTitle: string;
  title: string;
  body: string;
  locator: string;
  note: string;
  /** 例句。單字的卡片要秀這個——「這個字長什麼樣」比字義本身好記 */
  context: string;
  /** 讀音。單字卡標題上方那行小字 */
  pronunciation: string;
  date: string | null;
  createdAt: string;
  coverUrl: string;
};

/**
 * 整個 group 的片段。片段（佳句、單字、關鍵字）都在 fragments 表裡，靠類型屬於哪個 group 分。
 *
 * 出處的標題一起帶出來——概覽上「這句話出自哪本書」比片段本身還重要。
 */
async function listFragmentsOnly(userId: string, group: KindGroup): Promise<FragmentRow[]> {
  const rows = await db
    .select({ fragment: fragments, kind: kinds })
    .from(fragments)
    .innerJoin(kinds, eq(kinds.id, fragments.kindId))
    .where(and(eq(fragments.userId, userId), eq(kinds.groupKey, group)))
    .orderBy(desc(fragments.createdAt));

  const worksByFragment = await worksOfFragments(
    userId,
    rows.map(({ fragment }) => fragment.id),
  );

  return rows.map(({ fragment, kind }) => {
    const work = worksByFragment.get(fragment.id);
    return {
      id: fragment.id,
      kindId: kind.id,
      kindName: kind.name,
      kindCountUnit: kind.countUnit,
      kindGroup: kind.groupKey as KindGroup,
      kindSlug: kind.slug,
      workId: work?.id ?? null,
      workTitle: work?.title ?? "",
      title: fragment.title,
      body: fragment.body,
      locator: fragment.locator,
      note: fragment.body,
      context: fragment.context,
      pronunciation: fragment.pronunciation,
      date: fragment.date,
      createdAt: fragment.createdAt.toISOString(),
      // 佳句、單字沒填示意圖就用出處的封面——那句話本來就長在那本書上。
      // 關鍵字不退：一個詞不屬於任何一本書，掛書封只是誤導
      coverUrl: fragment.coverUrl || (kind.slug === "keywords" ? "" : (work?.coverUrl ?? "")),
    };
  });
}

/** 某一種片段類型底下的全部。自訂類型的清單頁走這條——紀錄那個 group 走 listRecordsByKind */
export async function listFragmentsByKind(userId: string, kindId: string): Promise<FragmentRow[]> {
  const rows = await db
    .select({ fragment: fragments, kind: kinds })
    .from(fragments)
    .innerJoin(kinds, eq(kinds.id, fragments.kindId))
    .where(and(eq(fragments.userId, userId), eq(fragments.kindId, kindId)))
    .orderBy(desc(fragments.createdAt));

  const worksByFragment = await worksOfFragments(
    userId,
    rows.map(({ fragment }) => fragment.id),
  );

  return rows.map(({ fragment, kind }) => {
    const work = worksByFragment.get(fragment.id);
    return {
      id: fragment.id,
      kindId: kind.id,
      kindName: kind.name,
      kindCountUnit: kind.countUnit,
      kindGroup: kind.groupKey as KindGroup,
      kindSlug: kind.slug,
      workId: work?.id ?? null,
      workTitle: work?.title ?? "",
      title: fragment.title,
      body: fragment.body,
      locator: fragment.locator,
      note: fragment.body,
      context: fragment.context,
      pronunciation: fragment.pronunciation,
      date: fragment.date,
      createdAt: fragment.createdAt.toISOString(),
      // 佳句、單字沒填示意圖就用出處的封面——那句話本來就長在那本書上。
      // 關鍵字不退：一個詞不屬於任何一本書，掛書封只是誤導
      coverUrl: fragment.coverUrl || (kind.slug === "keywords" ? "" : (work?.coverUrl ?? "")),
    };
  });
}

/**
 * 書寫獨立成表了，不在 fragments 裡——概覽頁要的形狀一樣，這裡轉一次。
 *
 * 類型讀自己那一列的 kind_id，不寫死「書寫」：書寫 group 底下不只一種，
 * 範本庫還有論述、每日計畫。
 *
 * 照 date 排不是 createdAt——補記一則舊心得，該落在它自己的日期上，
 * 不是跳到最前面。沒填日期的排最後，跟其他清單同一套規則。
 */
async function listWritingsAsFragments(userId: string): Promise<FragmentRow[]> {
  const rows = await listWritings(userId);
  return rows
    .map((writing) => ({
      id: writing.id,
      kindId: writing.kindId,
      kindName: writing.kindName,
      kindCountUnit: writing.kindCountUnit,
      kindGroup: "writings" as const,
      kindSlug: writing.kindSlug,
      workId: writing.sourceId || null,
      workTitle: writing.sourceTitle,
      title: writing.title,
      body: writing.note,
      locator: "",
      note: writing.note,
      context: "", // 書寫沒有例句這回事
      pronunciation: "",
      date: writing.date,
      createdAt: writing.createdAt,
      coverUrl: writing.coverUrl,
    }))
    .sort(byDateThenNewest((row) => row.date));
}

/** 某一種書寫類型底下的全部。書寫不在 fragments 表，走 listFragmentsByKind 會永遠是空的 */
export async function listWritingsByKind(userId: string, kindId: string): Promise<FragmentRow[]> {
  const rows = await listWritingsAsFragments(userId);
  return rows.filter((row) => row.kindId === kindId);
}

export async function listFragmentsByGroup(
  userId: string,
  group: KindGroup,
): Promise<FragmentRow[]> {
  if (group === "writings") return listWritingsAsFragments(userId);
  return listFragmentsOnly(userId, group);
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
): Promise<{ kindId: string; linkId: string; values: Record<string, string> } | null> {
  const [row] = await db
    .select({ record: records, work: works })
    .from(records)
    .innerJoin(works, eq(works.id, records.workId))
    .where(and(eq(records.userId, userId), eq(records.id, id)));
  if (!row) return null;

  const { record, work } = row;
  const [topic, attribute] = await Promise.all([
    topicNamesOf(userId, work.topicId),
    attributeNameOf(userId, work.attributeId),
  ]);

  return {
    kindId: work.kindId,
    // 站內關聯掛在作品上，不是掛在「某一次讀」——同一本書讀兩次，
    // 連到它的佳句與心得是同一批，不該跟著哪一次分家
    linkId: work.id,
    values: {
      title: work.title,
      creator: work.creator,
      language: work.language,
      startDate: record.startDate ?? "",
      endDate: record.endDate ?? "",
      amount: work.amount?.toString() ?? "",
      publisher: work.source,
      platform: work.platform,
      externalId: work.externalId,
      externalUrl: await sourceUrlOfRecord(userId, id),
      coverUrl: work.coverUrl,
      isPrivate: record.isPrivate ? "是" : "",
      // 表單的選單認名字不認編號（選項是從既有資料 group 出來的）
      domain: topic.domain,
      subDomain: topic.subDomain,
      attribute,
    },
  };
}

/**
 * topic_id 拆回表單上那兩格。
 *
 * 主題樹只有兩層：指到子節點就是「領域＝父、次領域＝自己」，
 * 指到父節點就是只填了領域。
 */
async function topicNamesOf(
  userId: string,
  topicId: string | null,
): Promise<{ domain: string; subDomain: string }> {
  if (!topicId) return { domain: "", subDomain: "" };

  const [node] = await db
    .select({ name: recordTopics.name, parentId: recordTopics.parentId })
    .from(recordTopics)
    .where(and(eq(recordTopics.userId, userId), eq(recordTopics.id, topicId)));
  if (!node) return { domain: "", subDomain: "" };
  if (!node.parentId) return { domain: node.name, subDomain: "" };

  const [parent] = await db
    .select({ name: recordTopics.name })
    .from(recordTopics)
    .where(and(eq(recordTopics.userId, userId), eq(recordTopics.id, node.parentId)));
  return { domain: parent?.name ?? "", subDomain: node.name };
}

async function attributeNameOf(userId: string, attributeId: string | null): Promise<string> {
  if (!attributeId) return "";
  const [row] = await db
    .select({ name: attributes.name })
    .from(attributes)
    .where(and(eq(attributes.userId, userId), eq(attributes.id, attributeId)));
  return row?.name ?? "";
}

/** 片段與書寫的單筆。欄位名跟紀錄那邊不一樣，攤平時一起對回模組認得的鍵 */
/**
 * 單筆書寫攤成表單的形狀。
 *
 * 書寫獨立成 writings 表了，不在 records 也不在 fragments——少了這一支，
 * 點進任何一則心得都是「找不到這一筆」。
 *
 * 沒有 amount：字數是內文本身算得出來的，不存。
 */
export async function getWritingValues(
  userId: string,
  id: string,
): Promise<{ kindId: string; linkId: string; values: Record<string, string> } | null> {
  const [row] = await db
    .select()
    .from(writings)
    .where(and(eq(writings.userId, userId), eq(writings.id, id)));
  if (!row) return null;

  return {
    kindId: row.kindId,
    // 片段與書寫沒有作品層，關聯就掛自己身上
    linkId: row.id,
    values: {
      title: row.title,
      body: row.body,
      endDate: row.date ?? "",
      coverUrl: row.coverUrl,
    },
  };
}

export async function getFragmentValues(
  userId: string,
  id: string,
): Promise<{ kindId: string; linkId: string; values: Record<string, string> } | null> {
  const [row] = await db
    .select()
    .from(fragments)
    .where(and(eq(fragments.userId, userId), eq(fragments.id, id)));
  if (!row) return null;

  return {
    kindId: row.kindId,
    // 片段與書寫沒有作品層，關聯就掛自己身上
    linkId: row.id,
    values: {
      title: row.title,
      body: row.body,
      locator: row.locator,
      translation: row.translation,
      context: row.context,
      contextTranslation: row.contextTranslation,
      tags: row.tags,
      // 數字欄回字串：表單的 input 一律吃字串，null 就是空的那一格
      startYear: row.startYear?.toString() ?? "",
      endYear: row.endYear?.toString() ?? "",
      latitude: row.latitude?.toString() ?? "",
      longitude: row.longitude?.toString() ?? "",
      endDate: row.date ?? "",
      externalUrl: await sourceUrlOfFragment(userId, id),
      coverUrl: row.coverUrl,
    },
  };
}
