import { and, asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { writingKeywords } from "@/lib/db/schema/keyword-links";
import { kinds } from "@/lib/db/schema/kinds";
import { works } from "@/lib/db/schema/works";
import { Writing } from "@/types/writing";
import { firstReadingIdByBookId } from "./books";
import { sourceUrlOfFragments } from "./external-links";

/**
 * 書寫讀回舊形狀。資料在 fragments 表裡，跟片段同一張——形狀一樣（一層、
 * 可空的出處），差別只在類型屬於哪一堆。
 *
 * 舊的「類型」欄混了兩件事：有出處時它記的是出處（書籍／文章），沒出處時記的
 * 才是真正的類型。這裡再合回去，畫面不用改。
 */

/** 出處的類型：這一則掛在書上還是文章上，舊形狀的 kind 欄要它 */
const sourceKind = alias(kinds, "source_kind");

async function keywordsByWriting(userId: string): Promise<Map<string, string[]>> {
  const rows = await db
    .select({ writingId: writingKeywords.writingId, keyword: writingKeywords.keyword })
    .from(writingKeywords)
    .where(eq(writingKeywords.userId, userId))
    .orderBy(asc(writingKeywords.keyword));

  const map = new Map<string, string[]>();
  for (const row of rows) map.set(row.writingId, [...(map.get(row.writingId) ?? []), row.keyword]);
  return map;
}

export async function listWritings(userId: string): Promise<Writing[]> {
  const [keywords, firstReading, rows] = await Promise.all([
    keywordsByWriting(userId),
    firstReadingIdByBookId(userId),
    db
      .select({
        fragment: fragments,
        kindName: kinds.name,
        workTitle: works.title,
        workKind: sourceKind.name,
      })
      .from(fragments)
      .innerJoin(kinds, eq(kinds.id, fragments.kindId))
      .leftJoin(works, eq(works.id, fragments.workId))
      .leftJoin(sourceKind, eq(sourceKind.id, works.kindId))
      .where(and(eq(fragments.userId, userId), eq(kinds.groupKey, "writings")))
      .orderBy(asc(fragments.createdAt)),
  ]);

  const links = await sourceUrlOfFragments(
    userId,
    rows.map(({ fragment }) => fragment.id),
  );

  return rows.map(({ fragment, kindName, workTitle, workKind }) => {
    // 畫面上的書籍編號是「某一次讀」，所以指回第一次讀的那個
    const sourceId = fragment.workId ? (firstReading.get(fragment.workId) ?? fragment.workId) : "";
    return {
      id: fragment.id,
      createdAt: fragment.createdAt.toISOString(),
      date: fragment.date,
      title: fragment.name,
      kind: workKind ?? kindName,
      keywords: (keywords.get(fragment.id) ?? []).join("\n"),
      note: fragment.body,
      link: links.get(fragment.id) ?? "",
      sourceTitle: workTitle ?? "",
      sourceId,
      private: "", // 片段不帶私人旗標，藏東西一律從主題與類型下手
    };
  });
}
