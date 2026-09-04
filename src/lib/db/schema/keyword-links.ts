import { foreignKey, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { articles, books } from "./reading";
import { keywords } from "./taxonomy";
import { writings } from "./writing";

/**
 * 關鍵字掛在誰身上。三張各自獨立，不做成一張多型別的表——那種表沒辦法用外鍵。
 *
 * 關鍵字的鍵是名字本身，所以每一張都要 on update cascade：改名時關聯自動跟著改，
 * 不會留下指向舊名字的孤兒。
 */

export const bookKeywords = pgTable(
  "book_keywords",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.bookId, t.keyword] }),
    foreignKey({ columns: [t.keyword], foreignColumns: [keywords.name] })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const articleKeywords = pgTable(
  "article_keywords",
  {
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.articleId, t.keyword] }),
    foreignKey({ columns: [t.keyword], foreignColumns: [keywords.name] })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const writingKeywords = pgTable(
  "writing_keywords",
  {
    writingId: uuid("writing_id")
      .notNull()
      .references(() => writings.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.writingId, t.keyword] }),
    foreignKey({ columns: [t.keyword], foreignColumns: [keywords.name] })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);
