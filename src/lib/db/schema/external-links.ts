import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * 外部連結。書的讀墨頁面、文章的原始網址、一則佳句的出處連結——
 * 六種類型共用這一張表，一列一個連結，不塞陣列。
 *
 * source_type 分兩種：'record' 指向 records（書籍／文章），'fragment' 指向
 * fragments（佳句／單字／關鍵字／書寫）。這兩張各自有自己的編號空間，
 * 所以 source_id 不能單獨當外鍵，要靠 source_type 才知道去哪張表對。
 *
 * 一筆資料可以有多個連結：一本書除了讀墨頁面，可能還有作者訪談的連結。
 * label 選填，用來說這個連結是什麼——沒填就照網址本身顯示。
 */
export const externalLinks = pgTable("links_external", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  id: uuid("id").primaryKey().defaultRandom(),
  sourceType: text("source_type").notNull(), // 'record' | 'fragment'
  sourceId: uuid("source_id").notNull(),
  url: text("url").notNull(),
  label: text("label").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
