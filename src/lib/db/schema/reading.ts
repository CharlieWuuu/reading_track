import { boolean, date, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { attributes, bookTypes } from "./taxonomy";

/**
 * 讀的東西：書、讀一次、文章。
 *
 * Sheet 上一列扛三件事——一本書、一個版本、一次閱讀——所以每讀一次就複製 18 個欄位，
 * 還要一個 originId 把它們認回來。這裡拆成兩張：書名作者屬於書，ISBN 平台頁數屬於
 * 「這次讀的那個版本」。重讀就是同一個 book_id 底下多一列。
 */

export const books = pgTable("books", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  author: text("author").notNull().default(""),
  typeId: uuid("type_id").references(() => bookTypes.id, { onDelete: "set null" }),
  attributeId: uuid("attribute_id").references(() => attributes.id, { onDelete: "set null" }),
  language: text("language").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 讀一次。版本資訊掛在這裡，因為紙本與電子書就是不同的一次 */
export const readings = pgTable("readings", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  isbn: text("isbn").notNull().default(""), // 電子書常常沒有，當線索不當身分
  platform: text("platform").notNull().default(""),
  publisher: text("publisher").notNull().default(""),
  pageCount: integer("page_count"),
  wordCount: integer("word_count"),
  sourceUrl: text("source_url").notNull().default(""),
  coverUrl: text("cover_url").notNull().default(""),
  isPrivate: boolean("is_private").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  author: text("author").notNull().default(""),
  platform: text("platform").notNull().default(""),
  sourceUrl: text("source_url").notNull().default(""),
  endDate: date("end_date"),
  typeId: uuid("type_id").references(() => bookTypes.id, { onDelete: "set null" }),
  attributeId: uuid("attribute_id").references(() => attributes.id, { onDelete: "set null" }),
  language: text("language").notNull().default(""),
  isPrivate: boolean("is_private").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
