import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { books } from "./reading";

/**
 * 讀到的東西：佳句、單字。
 *
 * book_id 可空——抄到一句話但不是從書上看到的，照樣留得下來。指向書而不是
 * 「哪一次讀」，重讀時記的句子看第一次那列時也該出現；要回推是第幾次讀，看 created_at。
 */

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id").references(() => books.id, { onDelete: "set null" }),
  text: text("text").notNull(),
  chapter: text("chapter").notNull().default(""),
  note: text("note").notNull().default(""), // 這一句的心得，跟整本書的分開
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vocabulary = pgTable("vocabulary", {
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
