import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db/client";
import { kinds } from "@/lib/db/schema/kinds";
import { works } from "@/lib/db/schema/works";
import { writings } from "@/lib/db/schema/writings";
import { Writing } from "@/types/writing";
import { firstReadingIdByBookId } from "./books";
import { sourceUrlOfFragments } from "./external-links";
import { keywordNamesByOwner } from "./internal-links";

/**
 * 書寫讀回舊形狀，畫面不用改。
 *
 * 舊的「類型」欄混了兩件事：有出處時它記的是出處（書籍／文章），沒出處時記的
 * 才是真正的類型。這裡再合回去。
 */

/** 出處的類型：這一則掛在書上還是文章上，舊形狀的 kind 欄要它 */
const sourceKind = alias(kinds, "source_kind");

export async function listWritings(userId: string): Promise<Writing[]> {
  const [firstReading, rows] = await Promise.all([
    firstReadingIdByBookId(userId),
    db
      .select({
        writing: writings,
        kindName: kinds.name,
        workTitle: works.title,
        workKind: sourceKind.name,
      })
      .from(writings)
      .innerJoin(kinds, eq(kinds.id, writings.kindId))
      .leftJoin(works, eq(works.id, writings.workId))
      .leftJoin(sourceKind, eq(sourceKind.id, works.kindId))
      .where(eq(writings.userId, userId))
      .orderBy(asc(writings.createdAt)),
  ]);

  const [links, keywords] = await Promise.all([
    sourceUrlOfFragments(
      userId,
      rows.map(({ writing }) => writing.id),
    ),
    keywordNamesByOwner(
      userId,
      rows.map(({ writing }) => writing.id),
    ),
  ]);

  return rows.map(({ writing, kindName, workTitle, workKind }) => {
    // 畫面上的書籍編號是「某一次讀」，所以指回第一次讀的那個
    const sourceId = writing.workId ? (firstReading.get(writing.workId) ?? writing.workId) : "";
    return {
      id: writing.id,
      createdAt: writing.createdAt.toISOString(),
      date: writing.date,
      title: writing.name,
      kind: workKind ?? kindName,
      keywords: keywords.get(writing.id) ?? "",
      note: writing.body,
      link: links.get(writing.id) ?? "",
      sourceTitle: workTitle ?? "",
      sourceId,
      private: "", // 書寫不帶私人旗標，藏東西一律從主題與類型下手
    };
  });
}
