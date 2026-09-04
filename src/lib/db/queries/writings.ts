import { asc, eq } from "drizzle-orm";
import { PRIVATE_MARK } from "@/config/sheet-format";
import { db } from "@/lib/db/client";
import { writingKeywords } from "@/lib/db/schema/keyword-links";
import { articles, books } from "@/lib/db/schema/reading";
import { writingTypes } from "@/lib/db/schema/taxonomy";
import { metrics, writings } from "@/lib/db/schema/writing";
import { Metric } from "@/types/metric";
import { Writing } from "@/types/writing";
import { firstReadingIdByBookId } from "./books";

/**
 * 書寫讀回舊形狀。
 *
 * 舊的「類型」欄混了兩件事：有出處時它記的是出處（書籍／文章），沒出處時記的
 * 才是真正的類型。資料庫把兩者分開存了，這裡再合回去，畫面才不用改。
 */

async function keywordsByWriting(): Promise<Map<string, string[]>> {
  const rows = await db
    .select({ writingId: writingKeywords.writingId, keyword: writingKeywords.keyword })
    .from(writingKeywords)
    .orderBy(asc(writingKeywords.keyword));

  const map = new Map<string, string[]>();
  for (const row of rows) map.set(row.writingId, [...(map.get(row.writingId) ?? []), row.keyword]);
  return map;
}

export async function listWritings(): Promise<Writing[]> {
  const [keywords, firstReading, rows] = await Promise.all([
    keywordsByWriting(),
    firstReadingIdByBookId(),
    db
      .select({
        writing: writings,
        typeName: writingTypes.name,
        bookTitle: books.title,
        articleTitle: articles.title,
      })
      .from(writings)
      .leftJoin(writingTypes, eq(writingTypes.id, writings.typeId))
      .leftJoin(books, eq(books.id, writings.bookId))
      .leftJoin(articles, eq(articles.id, writings.articleId))
      .orderBy(asc(writings.createdAt)),
  ]);

  return rows.map(({ writing, typeName, bookTitle, articleTitle }) => {
    // 畫面上的書籍編號是「某一次讀」，所以指回第一次讀的那個
    const sourceId = writing.bookId
      ? (firstReading.get(writing.bookId) ?? "")
      : (writing.articleId ?? "");
    return {
      id: writing.id,
      date: writing.date,
      title: writing.title,
      kind: writing.bookId ? "書籍" : writing.articleId ? "文章" : (typeName ?? ""),
      keywords: (keywords.get(writing.id) ?? []).join("\n"),
      note: writing.note,
      link: writing.link,
      sourceTitle: bookTitle ?? articleTitle ?? "",
      sourceId,
      private: writing.isPrivate ? PRIVATE_MARK : "",
    };
  });
}

export async function listMetrics(): Promise<Metric[]> {
  const rows = await db.select().from(metrics).orderBy(asc(metrics.date));
  return rows.map((m) => ({
    id: m.id,
    date: m.date,
    writingId: m.writingId,
    title: "", // 舊欄位，畫面靠 writingId 自己 join 得到標題
    platform: m.platform,
    views: m.views?.toString() ?? "",
    reads: m.reads?.toString() ?? "",
  }));
}
