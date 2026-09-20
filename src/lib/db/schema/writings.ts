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
import { users } from "./users";

/**
 * 書寫：心得、日記。獨立成表，不再跟佳句、單字、關鍵字擠 fragments。
 *
 * 出處（這則延伸自哪本書）走 links_internal，跟關鍵字同一張表——
 * 舊的 work_id 欄還在資料庫裡，但已經沒人讀寫，等著改名退休。
 *
 * 外部連結（發布網址）走 external_links，掛在自己的 writing_id 欄位上。
 */
export const writings = pgTable("domain_writings", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  id: uuid("id").primaryKey().defaultRandom(),
  kindId: uuid("kind_id")
    .notNull()
    .references(() => kinds.id, { onDelete: "restrict" }),
  // 這篇完成在哪天，跟紀錄的 end_date 同一個概念。建檔日看 created_at，兩者常常不同天
  endDate: date("end_date"),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""), // 內文
  // 三個 group 同一組欄位（0019）。原本這張表只有標題、長文、完成日期三個模組
  // 存得下，其餘 16 個勾了不生效——一套模組庫配三種形狀的表，必然對不上
  creator: text("creator").notNull().default(""),
  translation: text("translation").notNull().default(""),
  locator: text("locator").notNull().default(""),
  coverUrl: text("cover_url").notNull().default(""),
  startDate: date("start_date"),
  amount: integer("amount"),
  isPrivate: boolean("is_private").notNull().default(false),
  pronunciation: text("pronunciation").notNull().default(""),
  example: text("example").notNull().default(""),
  exampleTranslation: text("example_translation").notNull().default(""),
  tags: text("tags").notNull().default(""),
  startYear: integer("start_year"),
  endYear: integer("end_year"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  language: text("language").notNull().default(""),
  externalId: text("external_id").notNull().default(""),
  platform: text("platform").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
