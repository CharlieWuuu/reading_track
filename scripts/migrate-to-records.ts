import { and, eq } from "drizzle-orm";
import { db } from "../src/lib/db/client";
import { seedKinds } from "../src/lib/db/mutations/kinds";
import { fragments, quotes, vocabulary } from "../src/lib/db/schema/fragments";
import { recordKinds, recordKindStatuses } from "../src/lib/db/schema/kinds";
import { articles, books, readings } from "../src/lib/db/schema/reading";
import { keywords, writingTypes } from "../src/lib/db/schema/taxonomy";
import { users } from "../src/lib/db/schema/users";
import { records, works } from "../src/lib/db/schema/works";
import { writings } from "../src/lib/db/schema/writing";

/**
 * 把書籍與文章搬進 works／records。
 *
 * 用法：
 *   DATABASE_URL='...' npx tsx scripts/migrate-to-records.ts            乾跑，只印統計
 *   DATABASE_URL='...' npx tsx scripts/migrate-to-records.ts --apply    真的寫入
 *   ...--apply --reset                                                 清掉新表重搬
 *
 * 舊表一個字都不動，搬完兩套並存，確認過再刪。已經搬過的人跳過——判斷條件是
 * 「這個人的 works 是不是空的」，重跑一次不會長出兩份。
 */

const APPLY = process.argv.includes("--apply");
const RESET = process.argv.includes("--reset"); // 搬壞了重來：只砍新表，舊表不動

/** 舊的狀態是中文字串，新的指向 record_kind_statuses 那一列 */
const STATUS_KEY: Record<string, string> = {
  想讀: "want",
  閱讀中: "reading",
  已讀完: "done",
};

async function kindOf(userId: string, name: string) {
  const [kind] = await db
    .select({ id: recordKinds.id })
    .from(recordKinds)
    .where(and(eq(recordKinds.userId, userId), eq(recordKinds.name, name)));
  if (!kind) throw new Error(`${name} 這個類型不存在，先跑種子`);
  return kind.id;
}

async function statusesOf(kindId: string): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: recordKindStatuses.id, key: recordKindStatuses.key })
    .from(recordKindStatuses)
    .where(eq(recordKindStatuses.kindId, kindId));
  return new Map(rows.map((r) => [r.key, r.id]));
}

async function migrateBooks(userId: string): Promise<number> {
  const kindId = await kindOf(userId, "書籍");
  const statuses = await statusesOf(kindId);

  const rows = await db
    .select({ book: books, reading: readings })
    .from(readings)
    .innerJoin(books, eq(books.id, readings.bookId))
    .where(eq(readings.userId, userId));

  /** 一本書搬一次，底下每一次閱讀各一列——這正是拆兩層的理由 */
  const workIdOf = new Map<string, string>();

  for (const { book, reading } of rows) {
    // 作品沿用書的編號：佳句與單字的 book_id 才對得回來，不用另外留一張對照表
    let workId = workIdOf.get(book.id);
    if (!workId) {
      workId = book.id;
      workIdOf.set(book.id, workId);
      if (APPLY) {
        await db.insert(works).values({
          id: workId,
          userId,
          kindId,
          title: book.title,
          creator: book.author,
          topicId: book.typeId,
          attributeId: book.attributeId,
          language: book.language,
          createdAt: book.createdAt,
        });
      }
    }

    const statusId = statuses.get(STATUS_KEY[reading.status] ?? "done");
    if (!statusId) throw new Error(`對不到狀態：${reading.status}`);

    if (APPLY) {
      await db.insert(records).values({
        // 沿用舊編號：/reading/books/<id> 那些連結與書籤才不會全部失效
        id: reading.id,
        userId,
        workId,
        statusId,
        startDate: reading.startDate,
        endDate: reading.endDate,
        amount: reading.pageCount,
        amountUnit: reading.pageCount ? "頁" : "",
        source: reading.publisher || reading.platform,
        sourceUrl: reading.sourceUrl,
        externalId: reading.isbn,
        coverUrl: reading.coverUrl,
        isPrivate: reading.isPrivate,
        createdAt: reading.createdAt,
      });
    }
  }

  console.log(`  書籍：${workIdOf.size} 本作品、${rows.length} 次閱讀`);
  return rows.length;
}

async function migrateArticles(userId: string): Promise<number> {
  const kindId = await kindOf(userId, "文章");
  const statuses = await statusesOf(kindId);
  const rows = await db.select().from(articles).where(eq(articles.userId, userId));

  for (const article of rows) {
    const workId = article.id;
    // 文章沒有重讀的概念，一篇就是一次，所以作品與紀錄一對一
    const statusId = statuses.get(article.endDate ? "done" : "want");
    if (!statusId) throw new Error("文章的狀態對不到");

    if (APPLY) {
      await db.insert(works).values({
        id: workId,
        userId,
        kindId,
        title: article.title,
        creator: article.author,
        topicId: article.typeId,
        attributeId: article.attributeId,
        language: article.language,
        createdAt: article.createdAt,
      });
      await db.insert(records).values({
        id: article.id,
        userId,
        workId,
        statusId,
        endDate: article.endDate,
        source: article.platform,
        sourceUrl: article.sourceUrl,
        isPrivate: article.isPrivate,
        createdAt: article.createdAt,
      });
    }
  }

  console.log(`  文章：${rows.length} 篇`);
  return rows.length;
}

/**
 * 片段：佳句、單字、關鍵字。
 *
 * work_id 直接沿用舊的 book_id——作品的編號就是書的編號，所以對得回去。
 * 關鍵字沒有出處，work_id 留空。
 */
async function migrateFragments(userId: string): Promise<number> {
  const quoteKind = await kindOf(userId, "佳句");
  const vocabKind = await kindOf(userId, "單字");
  const keywordKind = await kindOf(userId, "關鍵字");

  const [quoteRows, vocabRows, keywordRows] = await Promise.all([
    db.select().from(quotes).where(eq(quotes.userId, userId)),
    db.select().from(vocabulary).where(eq(vocabulary.userId, userId)),
    db.select().from(keywords).where(eq(keywords.userId, userId)),
  ]);

  if (APPLY) {
    for (const row of quoteRows) {
      await db.insert(fragments).values({
        id: row.id,
        userId,
        kindId: quoteKind,
        workId: row.bookId,
        body: row.text,
        locator: row.chapter,
        note: row.note,
        createdAt: row.createdAt,
      });
    }
    for (const row of vocabRows) {
      await db.insert(fragments).values({
        id: row.id,
        userId,
        kindId: vocabKind,
        workId: row.bookId,
        name: row.word,
        pronunciation: row.pronunciation,
        translation: row.wordTranslation,
        context: row.sentence,
        contextTranslation: row.sentenceTranslation,
        locator: row.chapter,
        createdAt: row.createdAt,
      });
    }
    for (const row of keywordRows) {
      // 關鍵字舊表以名字當主鍵，搬過來才有自己的編號
      await db.insert(fragments).values({
        userId,
        kindId: keywordKind,
        name: row.name,
        body: row.summary,
        topics: row.topics,
        span: row.span,
        coordinates: row.coordinates,
        wikiUrl: row.wikiUrl,
      });
    }
  }

  console.log(
    `  片段：${quoteRows.length} 句、${vocabRows.length} 字、${keywordRows.length} 個關鍵字`,
  );
  return quoteRows.length + vocabRows.length + keywordRows.length;
}

/**
 * 專欄：舊表的類型是自由文字。對得上現有類型就用它，對不上的歸「日記」——
 * 不在這裡替使用者長出新類型，那是他自己在建立頁上決定的事。
 */
async function migrateWritings(userId: string): Promise<number> {
  const existing = await db
    .select({ id: recordKinds.id, name: recordKinds.name })
    .from(recordKinds)
    .where(and(eq(recordKinds.userId, userId), eq(recordKinds.groupKey, "writings")));
  const kindIds = new Map(existing.map((k) => [k.name, k.id]));
  const fallback = kindIds.get("日記") ?? existing[0]?.id;
  if (!fallback) throw new Error("專欄那一堆一種類型都沒有，先跑種子");

  const rows = await db
    .select({ writing: writings, type: writingTypes.name })
    .from(writings)
    .leftJoin(writingTypes, eq(writingTypes.id, writings.typeId))
    .where(eq(writings.userId, userId));

  if (APPLY) {
    for (const { writing, type } of rows) {
      await db.insert(fragments).values({
        id: writing.id,
        userId,
        kindId: kindIds.get(type ?? "") ?? fallback,
        workId: writing.bookId ?? writing.articleId,
        date: writing.date,
        name: writing.title,
        body: writing.note,
        wikiUrl: writing.link,
        createdAt: writing.createdAt,
      });
    }
  }

  console.log(`  專欄：${rows.length} 則`);
  return rows.length;
}

async function main() {
  console.log(APPLY ? "== 寫入 ==" : "== 乾跑，不寫入 ==");

  for (const user of await db.select({ id: users.id, email: users.email }).from(users)) {
    if (RESET && APPLY) {
      await db.delete(fragments).where(eq(fragments.userId, user.id));
      await db.delete(records).where(eq(records.userId, user.id));
      await db.delete(works).where(eq(works.userId, user.id));
    }

    await seedKinds(user.id); // 還沒有任何類型的話先給起手那幾種

    const [existing] = await db
      .select({ id: works.id })
      .from(works)
      .where(eq(works.userId, user.id))
      .limit(1);
    if (existing) {
      console.log(`${user.email}：已經搬過，跳過`);
      continue;
    }

    console.log(user.email);
    await migrateBooks(user.id);
    await migrateArticles(user.id);
    await migrateFragments(user.id);
    await migrateWritings(user.id);
  }

  process.exit(0);
}

void main();
