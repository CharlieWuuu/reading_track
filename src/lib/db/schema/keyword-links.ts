import { foreignKey, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { fragments } from "./fragments";
import { keywords } from "./taxonomy";
import { users } from "./users";
import { works } from "./works";

/**
 * 關鍵字掛在誰身上。關鍵字主檔每人一份，所以外鍵是 (user_id, keyword) 複合鍵。
 * 三張各自獨立，不做成一張多型別的表——那種表沒辦法用外鍵。
 *
 * 欄名還是 book_id／article_id／writing_id，但指的都是新表：前兩張指作品，
 * 第三張指片段。改欄名要動的地方比留著多，而註解說得清楚。
 *
 * 關鍵字的鍵是名字本身，所以每一張都要 on update cascade：改名時關聯自動跟著改，
 * 不會留下指向舊名字的孤兒。
 */

export const bookKeywords = pgTable(
  "book_keywords",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }), // 欄名沿用，指的是作品
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.bookId, t.keyword] }),
    foreignKey({
      columns: [t.userId, t.keyword],
      foreignColumns: [keywords.userId, keywords.name],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const articleKeywords = pgTable(
  "article_keywords",
  {
    articleId: uuid("article_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.articleId, t.keyword] }),
    foreignKey({
      columns: [t.userId, t.keyword],
      foreignColumns: [keywords.userId, keywords.name],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const writingKeywords = pgTable(
  "writing_keywords",
  {
    writingId: uuid("writing_id")
      .notNull()
      .references(() => fragments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.writingId, t.keyword] }),
    foreignKey({
      columns: [t.userId, t.keyword],
      foreignColumns: [keywords.userId, keywords.name],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);
