import { date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { kinds } from "./kinds";
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
 * 不帶私人旗標，跟舊的關鍵字主檔同一個理由：「馬克思」本身不敏感，敏感的是那本書
 * 屬於哪個領域。藏東西一律從主題與類型下手。
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
  /** 這件事發生在哪一天。記下的時間看 created_at，兩者不是同一件事 */
  date: date("date"),
  name: text("name").notNull().default(""), // 單字、詞條
  phrase: text("phrase").notNull().default(""), // 佳句本文
  body: text("body").notNull().default(""), // 原文、維基摘要、佳句的心得
  locator: text("locator").notNull().default(""), // 章節、頁碼
  pronunciation: text("pronunciation").notNull().default(""),
  translation: text("translation").notNull().default(""),
  context: text("context").notNull().default(""), // 例句
  contextTranslation: text("context_translation").notNull().default(""),
  tags: text("tags").notNull().default(""), // 自己貼的標籤，多個以頓號相接，跟 domain_topics 的主題樹是兩回事
  span: text("span").notNull().default(""), // 生卒或起訖
  coordinates: text("coordinates").notNull().default(""), // "25.033,121.565"
  coverUrl: text("cover_url").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
