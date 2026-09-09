import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { fragments } from "./fragments";
import { users } from "./users";
import { records } from "./works";
import { writings } from "./writings";

/**
 * 外部連結。書的讀墨頁面、文章的原始網址、一則佳句的出處連結、一篇書寫的發布網址——
 * 四種來源共用這一張表，一列一個連結，不塞陣列。
 *
 * record_id／fragment_id／writing_id 三欄可空，各自是真的外鍵——一筆連結恰好屬於
 * 其中一邊，用 CHECK 頂住「剛好一個非空」，不再靠 source_type 這種應用層判斷去對表。
 *
 * 一筆資料可以有多個連結：一本書除了讀墨頁面，可能還有作者訪談的連結。
 * label 選填，用來說這個連結是什麼——沒填就照網址本身顯示。
 */
export const externalLinks = pgTable(
  "links_external",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    id: uuid("id").primaryKey().defaultRandom(),
    recordId: uuid("record_id").references(() => records.id, { onDelete: "cascade" }),
    fragmentId: uuid("fragment_id").references(() => fragments.id, { onDelete: "cascade" }),
    writingId: uuid("writing_id").references(() => writings.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    label: text("label").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "links_external_exactly_one_source",
      sql`(
        (${t.recordId} is not null)::int +
        (${t.fragmentId} is not null)::int +
        (${t.writingId} is not null)::int
      ) = 1`,
    ),
  ],
);
