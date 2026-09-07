import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { recordKinds } from "./kinds";
import { books } from "./reading";
import { users } from "./users";
import { works } from "./works";

/**
 * 片段：佳句、單字。從紀錄裡摘出來的東西。
 *
 * 底下的 fragments 是新的一張，三種片段共用；quotes 與 vocabulary 是舊表，
 * 資料搬完就退場，在那之前兩套並存。
 *
 * book_id 可空——抄到一句話但不是從書上看到的，照樣留得下來。指向書而不是
 * 「哪一次讀」，重讀時記的句子看第一次那列時也該出現；要回推是第幾次讀，看 created_at。
 */

export const quotes = pgTable("quotes", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id").references(() => books.id, { onDelete: "set null" }),
  text: text("text").notNull(),
  chapter: text("chapter").notNull().default(""),
  note: text("note").notNull().default(""), // 這一句的心得，跟整本書的分開
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vocabulary = pgTable("vocabulary", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id").references(() => books.id, { onDelete: "set null" }),
  word: text("word").notNull(),
  pronunciation: text("pronunciation").notNull().default(""),
  wordTranslation: text("word_translation").notNull().default(""),
  sentence: text("sentence").notNull().default(""),
  sentenceTranslation: text("sentence_translation").notNull().default(""),
  chapter: text("chapter").notNull().default(""),
  language: text("language").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 新的片段表。佳句、單字、關鍵字都是這張表的一列，靠 kind_id 分。
 *
 * 一層，不像紀錄有作品那一層——一句話不會被讀第二次。
 *
 * work_id 可空，抄到一句話但不是從書上看到的照樣留得下來。指向作品而不是
 * 「哪一次讀」，重讀時記的句子看第一次那筆時也該出現。
 *
 * 欄位刻意寬而稀疏：一句話沒有發音，一個單字沒有座標。這是共用一組欄位的代價，
 * 換來的是新增一種片段不用開表。
 *
 * 不帶私人旗標，跟舊的關鍵字主檔同一個理由：「馬克思」本身不敏感，敏感的是那本書
 * 屬於哪個領域。藏東西一律從主題與類型下手。
 */
export const fragments = pgTable("fragments", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  id: uuid("id").primaryKey().defaultRandom(),
  kindId: uuid("kind_id")
    .notNull()
    .references(() => recordKinds.id, { onDelete: "restrict" }),
  workId: uuid("work_id").references(() => works.id, { onDelete: "set null" }),
  name: text("name").notNull().default(""), // 單字、詞條；佳句沒有名字
  body: text("body").notNull().default(""), // 原文、維基摘要
  locator: text("locator").notNull().default(""), // 章節、頁碼
  pronunciation: text("pronunciation").notNull().default(""),
  translation: text("translation").notNull().default(""),
  context: text("context").notNull().default(""), // 例句
  contextTranslation: text("context_translation").notNull().default(""),
  topics: text("topics").notNull().default(""), // 維基主題，多個以頓號相接
  span: text("span").notNull().default(""), // 生卒或起訖
  coordinates: text("coordinates").notNull().default(""), // "25.033,121.565"
  wikiUrl: text("wiki_url").notNull().default(""),
  note: text("note").notNull().default(""), // 這一則的心得
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
