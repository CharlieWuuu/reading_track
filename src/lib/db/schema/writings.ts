import { date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { kinds } from "./kinds";
import { users } from "./users";
import { works } from "./works";

/**
 * 書寫：心得、日記。獨立成表，不再跟佳句、單字、關鍵字擠 fragments。
 *
 * work_id 可空：心得掛著讀了哪本書，日記沒有出處。
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
  workId: uuid("work_id").references(() => works.id, { onDelete: "set null" }),
  date: date("date"),
  name: text("name").notNull().default(""), // 標題
  body: text("body").notNull().default(""), // 內文
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
