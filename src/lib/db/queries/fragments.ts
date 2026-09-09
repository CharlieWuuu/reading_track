import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { kinds } from "@/lib/db/schema/kinds";
import { works } from "@/lib/db/schema/works";
import { KeywordInfo } from "@/types/keyword";
import { QuoteRow, VocabularyRow } from "@/types/record";
import { firstReadingIdByBookId } from "./books";
import { sourceUrlOfFragments } from "./external-links";

/**
 * 佳句、單字、關鍵字讀回舊形狀。三種都在 fragments 表裡，靠類型分。
 *
 * 資料庫裡它們指向「作品」，畫面上的書籍編號卻是「某一次讀」——所以出去之前
 * 換成第一次讀的那個編號。work_id 是空的（不是從書上看到的）就留空，
 * 那種列在畫面上是沒有主人的紀錄。
 */

const rowsOfKind = (userId: string, kindName: string) =>
  db
    .select({ fragment: fragments, workTitle: works.title })
    .from(fragments)
    .innerJoin(kinds, eq(kinds.id, fragments.kindId))
    .leftJoin(works, eq(works.id, fragments.workId))
    .where(and(eq(fragments.userId, userId), eq(kinds.name, kindName)))
    .orderBy(asc(fragments.createdAt));

export async function listQuoteRows(userId: string): Promise<QuoteRow[]> {
  const [firstReading, rows] = await Promise.all([
    firstReadingIdByBookId(userId),
    rowsOfKind(userId, "佳句"),
  ]);

  return rows.map(({ fragment, workTitle }) => ({
    id: fragment.id,
    bookId: fragment.workId ? (firstReading.get(fragment.workId) ?? "") : "",
    bookTitle: workTitle ?? "",
    text: fragment.phrase,
    chapter: fragment.locator,
    note: fragment.body,
  }));
}

export async function listVocabularyRows(userId: string): Promise<VocabularyRow[]> {
  const [firstReading, rows] = await Promise.all([
    firstReadingIdByBookId(userId),
    rowsOfKind(userId, "單字"),
  ]);

  return rows.map(({ fragment, workTitle }) => ({
    id: fragment.id,
    bookId: fragment.workId ? (firstReading.get(fragment.workId) ?? "") : "",
    bookTitle: workTitle ?? "",
    word: fragment.name,
    pronunciation: fragment.pronunciation,
    wordTranslation: fragment.translation,
    sentence: fragment.context,
    sentenceTranslation: fragment.contextTranslation,
    chapter: fragment.locator,
    language: "", // 語言在作品那一層，單字自己不帶
    createdAt: fragment.createdAt.toISOString(),
  }));
}

/** 關鍵字的舊形狀以名字當身分，新表有自己的編號，出去之前還原成名字 */
export async function listKeywords(userId: string): Promise<KeywordInfo[]> {
  const rows = await rowsOfKind(userId, "關鍵字");
  const wikiUrls = await sourceUrlOfFragments(
    userId,
    rows.map(({ fragment }) => fragment.id),
  );

  return rows
    .map(({ fragment }) => ({
      name: fragment.name,
      topics: fragment.topics,
      coordinates: fragment.coordinates,
      span: fragment.span,
      wikiUrl: wikiUrls.get(fragment.id) ?? "",
      summary: fragment.body,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
