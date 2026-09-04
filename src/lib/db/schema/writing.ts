import { sql } from "drizzle-orm";
import { boolean, check, date, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { articles, books } from "./reading";
import { writingTypes } from "./taxonomy";

/**
 * 自己寫的東西，以及它的流量。
 *
 * 出處拆成兩個可空外鍵而不是一組 sourceId：資料庫才擋得住指向不存在的編號。
 * 兩個都空就是不從任何紀錄延伸出來的一則——日記、隨手想法。
 */
export const writings = pgTable(
  "writings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookId: uuid("book_id").references(() => books.id, { onDelete: "set null" }),
    articleId: uuid("article_id").references(() => articles.id, { onDelete: "set null" }),
    typeId: uuid("type_id").references(() => writingTypes.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    note: text("note").notNull().default(""),
    date: date("date"),
    link: text("link").notNull().default(""), // 網址，或「紙本日記 8/17」這種純文字
    isPrivate: boolean("is_private").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("one_source", sql`${t.bookId} is null or ${t.articleId} is null`)],
);

export const metrics = pgTable("metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  writingId: uuid("writing_id")
    .notNull()
    .references(() => writings.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  platform: text("platform").notNull().default(""),
  views: integer("views"),
  reads: integer("reads"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
