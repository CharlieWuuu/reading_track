import { date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { kinds } from "./kinds";
import { writingTopics } from "./taxonomy";
import { users } from "./users";

/**
 * 書寫：心得、日記。獨立成表，不再跟佳句、單字、關鍵字擠 fragments。
 *
 * 出處（這則延伸自哪本書）走 links_internal，跟關鍵字同一張表——
 * 舊的 work_id 欄還在資料庫裡，但已經沒人讀寫，等著改名退休。
 *
 * topic_id 指向 writing_topics——書寫自己的主題樹（思緒、工作），
 * 跟書/文章的 record_topics 是兩棵不相干的樹。
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
  topicId: uuid("topic_id").references(() => writingTopics.id, { onDelete: "set null" }),
  date: date("date"),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""), // 內文
  coverUrl: text("cover_url").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
