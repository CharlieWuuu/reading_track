import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bookKeywords } from "@/lib/db/schema/keyword-links";
import { readings } from "@/lib/db/schema/reading";
import { quotes, vocabulary } from "@/lib/db/schema/records";
import { keywords } from "@/lib/db/schema/taxonomy";
import { KeywordInfo } from "@/types/keyword";
import { QuoteRow, VocabularyRow } from "@/types/record";

/**
 * 佳句、單字、關鍵字主檔的寫入。
 *
 * 畫面送進來的 bookId 是「某一次讀」的編號，資料庫記的是「哪本書」——
 * 換算在這一層做完，呼叫端不用知道有這回事。
 */

async function bookIdOf(userId: string, readingId: string): Promise<string | null> {
  const id = readingId.trim();
  if (!id) return null;
  const [row] = await db
    .select({ bookId: readings.bookId })
    .from(readings)
    .where(and(eq(readings.userId, userId), eq(readings.id, id)));
  return row?.bookId ?? null;
}

/** 一本書的佳句整批換掉：先刪屬於它的，再把新的加回去 */
export async function replaceBookQuotes(
  userId: string,
  readingId: string,
  items: QuoteRow[],
): Promise<void> {
  const bookId = await bookIdOf(userId, readingId);
  if (!bookId) return;

  const rows = items
    .filter((item) => item.text.trim())
    .map((item) => ({
      id: item.id || crypto.randomUUID(),
      userId,
      bookId,
      text: item.text,
      chapter: item.chapter,
      note: item.note,
    }));

  await db.transaction(async (tx) => {
    await tx.delete(quotes).where(and(eq(quotes.userId, userId), eq(quotes.bookId, bookId)));
    if (rows.length) await tx.insert(quotes).values(rows);
  });
}

export async function replaceBookVocabulary(
  userId: string,
  readingId: string,
  items: VocabularyRow[],
): Promise<void> {
  const bookId = await bookIdOf(userId, readingId);
  if (!bookId) return;

  const rows = items
    .filter((item) => item.word.trim())
    .map((item) => ({
      id: item.id || crypto.randomUUID(),
      userId,
      bookId,
      word: item.word,
      pronunciation: item.pronunciation,
      wordTranslation: item.wordTranslation,
      sentence: item.sentence,
      sentenceTranslation: item.sentenceTranslation,
      chapter: item.chapter,
      language: item.language,
    }));

  await db.transaction(async (tx) => {
    await tx
      .delete(vocabulary)
      .where(and(eq(vocabulary.userId, userId), eq(vocabulary.bookId, bookId)));
    if (rows.length) await tx.insert(vocabulary).values(rows);
  });
}

/** 維基查回來的資料整批寫入；已經有的就更新，不動使用者自己填的名字 */
export async function saveKeywordInfos(userId: string, infos: KeywordInfo[]): Promise<void> {
  for (const info of infos) {
    await db
      .insert(keywords)
      .values({
        userId,
        name: info.name,
        topics: info.topics,
        coordinates: info.coordinates,
        span: info.span,
        wikiUrl: info.wikiUrl,
        summary: info.summary,
      })
      .onConflictDoUpdate({
        target: [keywords.userId, keywords.name],
        set: {
          topics: info.topics,
          coordinates: info.coordinates,
          span: info.span,
          wikiUrl: info.wikiUrl,
          summary: info.summary,
        },
      });
  }
}

/** 使用者親手改的那一列，整列照寫——這裡不是自動補齊，不必保護既有值 */
export async function replaceKeywordInfo(userId: string, info: KeywordInfo): Promise<void> {
  await saveKeywordInfos(userId, [info]);
}

/**
 * 關鍵字改名。名字就是主鍵，加了 on update cascade，所以三張關聯表自動跟著改。
 *
 * 改成一個已經存在的名字等於合併：那時 cascade 會撞上重複的主鍵，所以先把
 * 已經兩邊都掛著的關聯拆掉，再讓資料庫去改名。回傳動到幾本書。
 */
export async function renameKeyword(userId: string, from: string, to: string): Promise<number> {
  if (!from || !to || from === to) return 0;

  const affected = await db
    .select({ bookId: bookKeywords.bookId })
    .from(bookKeywords)
    .where(and(eq(bookKeywords.userId, userId), eq(bookKeywords.keyword, from)));

  const [existing] = await db
    .select({ name: keywords.name })
    .from(keywords)
    .where(and(eq(keywords.userId, userId), eq(keywords.name, to)));

  await db.transaction(async (tx) => {
    if (existing) {
      // 合併：舊名字的關聯改指新名字，重複的丟掉，然後刪掉舊那一列
      const rows = affected.map((r) => ({ userId, bookId: r.bookId, keyword: to }));
      if (rows.length) await tx.insert(bookKeywords).values(rows).onConflictDoNothing();
      await tx.delete(keywords).where(and(eq(keywords.userId, userId), eq(keywords.name, from)));
    } else {
      await tx
        .update(keywords)
        .set({ name: to })
        .where(and(eq(keywords.userId, userId), eq(keywords.name, from)));
    }
  });

  return affected.length;
}

/** 刪掉主檔那一列，關聯表靠 on delete cascade 一起清掉。回傳動到幾本書 */
export async function deleteKeyword(userId: string, name: string): Promise<number> {
  const affected = await db
    .select({ bookId: bookKeywords.bookId })
    .from(bookKeywords)
    .where(and(eq(bookKeywords.userId, userId), eq(bookKeywords.keyword, name)));

  await db.delete(keywords).where(and(eq(keywords.userId, userId), eq(keywords.name, name)));
  return affected.length;
}
