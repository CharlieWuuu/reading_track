import { and, eq } from "drizzle-orm";
import { db } from "../src/lib/db/client";
import { recordKinds, recordKindStatuses } from "../src/lib/db/schema/kinds";
import { articles, books, readings } from "../src/lib/db/schema/reading";
import { users } from "../src/lib/db/schema/users";
import { records, works } from "../src/lib/db/schema/works";

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
    let workId = workIdOf.get(book.id);
    if (!workId) {
      workId = crypto.randomUUID();
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
    const workId = crypto.randomUUID();
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

async function main() {
  console.log(APPLY ? "== 寫入 ==" : "== 乾跑，不寫入 ==");

  for (const user of await db.select({ id: users.id, email: users.email }).from(users)) {
    if (RESET && APPLY) {
      await db.delete(records).where(eq(records.userId, user.id));
      await db.delete(works).where(eq(works.userId, user.id));
    }

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
  }

  process.exit(0);
}

void main();
