import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { books } from "@/lib/db/schema/reading";
import { quotes, vocabulary } from "@/lib/db/schema/records";
import { keywords } from "@/lib/db/schema/taxonomy";
import { KeywordInfo } from "@/types/keyword";
import { QuoteRow, VocabularyRow } from "@/types/record";
import { firstReadingIdByBookId } from "./books";

/**
 * 佳句與單字讀回舊形狀。
 *
 * 資料庫裡它們指向「書」，畫面上的書籍編號卻是「某一次讀」——所以出去之前
 * 換成第一次讀的那個編號。book_id 是空的（不是從書上看到的）就留空，
 * 那種列在畫面上是沒有主人的紀錄。
 */

export async function listQuoteRows(): Promise<QuoteRow[]> {
  const [firstReading, rows] = await Promise.all([
    firstReadingIdByBookId(),
    db
      .select({ quote: quotes, bookTitle: books.title })
      .from(quotes)
      .leftJoin(books, eq(books.id, quotes.bookId))
      .orderBy(asc(quotes.createdAt)),
  ]);

  return rows.map(({ quote, bookTitle }) => ({
    id: quote.id,
    bookId: quote.bookId ? (firstReading.get(quote.bookId) ?? "") : "",
    bookTitle: bookTitle ?? "",
    text: quote.text,
    chapter: quote.chapter,
    note: quote.note,
  }));
}

export async function listVocabularyRows(): Promise<VocabularyRow[]> {
  const [firstReading, rows] = await Promise.all([
    firstReadingIdByBookId(),
    db
      .select({ word: vocabulary, bookTitle: books.title })
      .from(vocabulary)
      .leftJoin(books, eq(books.id, vocabulary.bookId))
      .orderBy(asc(vocabulary.createdAt)),
  ]);

  return rows.map(({ word, bookTitle }) => ({
    id: word.id,
    bookId: word.bookId ? (firstReading.get(word.bookId) ?? "") : "",
    bookTitle: bookTitle ?? "",
    word: word.word,
    pronunciation: word.pronunciation,
    wordTranslation: word.wordTranslation,
    sentence: word.sentence,
    sentenceTranslation: word.sentenceTranslation,
    chapter: word.chapter,
    language: word.language,
  }));
}

export async function listKeywords(): Promise<KeywordInfo[]> {
  const rows = await db.select().from(keywords).orderBy(asc(keywords.name));
  return rows.map((k) => ({
    name: k.name,
    topics: k.topics,
    coordinates: k.coordinates,
    span: k.span,
    wikiUrl: k.wikiUrl,
    summary: k.summary,
  }));
}
