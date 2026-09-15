import { doublePrecision, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
  coverUrl: text("cover_url").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
