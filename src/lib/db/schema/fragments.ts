import {
  boolean,
  date,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { kinds } from "./kinds";
import { attributes, recordTopics } from "./taxonomy";
import { users } from "./users";

/**
 * 新的片段表。佳句、單字、關鍵字都是這張表的一列，靠 kind_id 分。
 *
 * 一層，不像紀錄有作品那一層——一句話不會被讀第二次。
 *
 * 跟作品的關聯走 internal_links，不是自己的欄位——抄到一句話但不是從書上
 * 看到的照樣留得下來，沒有作品可連。跟關鍵字連誰是同一套機制。
 *
 * 欄位刻意寬而稀疏：一句話沒有發音，一個單字沒有座標。這是共用一組欄位的代價，
 * 換來的是新增一種片段不用開表。
 *
 *
 * 連結（關鍵字的維基連結、書寫的發布連結）不在這裡，走 external_links——
 * 跟紀錄共用同一張表，一筆可以有多個連結。
 */
export const fragments = pgTable("domain_fragments", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  id: uuid("id").primaryKey().defaultRandom(),
  kindId: uuid("kind_id")
    .notNull()
    .references(() => kinds.id, { onDelete: "restrict" }),
  // 這一筆的標題：單字是那個字、關鍵字是詞條、佳句是整句話。
  // 本來分成 name 與 phrase 兩欄，但從來沒有一筆兩個都有值
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""), // 原文、維基摘要、佳句的心得
  locator: text("locator").notNull().default(""), // 章節、頁碼
  pronunciation: text("pronunciation").notNull().default(""),
  translation: text("translation").notNull().default(""),
  example: text("example").notNull().default(""), // 例句：這個詞用在句子裡長什麼樣
  exampleTranslation: text("example_translation").notNull().default(""),
  tags: text("tags").notNull().default(""), // 自己貼的標籤，多個以頓號相接，跟 domain_topics 的主題樹是兩回事
  // 生卒或存續的那段年份。一欄塞 "1818－1883" 要靠剖析拆，破折號、西元前的
  // 負號、只有單邊都得各自處理；兩欄各存一個數字，這些情況全部消失。
  // 負數是西元前。只有起沒有訖（還活著、還在）就留空
  startYear: integer("start_year"),
  endYear: integer("end_year"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  // 三個 group 同一組欄位（0019）。設定頁的模組庫是一套，資料表卻各有各的欄位，
  // 結果 57 格裡有 33 格勾了不生效——補齊之後勾什麼就存得下什麼
  creator: text("creator").notNull().default(""),
  coverUrl: text("cover_url").notNull().default(""),
  startDate: date("start_date"),
  endDate: date("end_date"),
  amount: integer("amount"),
  isPrivate: boolean("is_private").notNull().default(false),
  language: text("language").notNull().default(""),
  externalId: text("external_id").notNull().default(""),
  platform: text("platform").notNull().default(""),
  // 領域與屬性指向各自帳號的分類樹（0020）。三個 group 都用得到——
  // 一則心得屬於哪個領域，跟一本書屬於哪個領域是同一個問題
  topicId: uuid("topic_id").references(() => recordTopics.id, { onDelete: "set null" }),
  attributeId: uuid("attribute_id").references(() => attributes.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
