import { AnyPgColumn, boolean, pgTable, primaryKey, text, unique, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * 標記類的表。書、文章、書寫都靠這幾張分類。
 *
 * 私人旗標放在這裡而不是每一筆資料上：想藏的是「政治」「日記」這種主題，
 * 標一次就好，不用一本一本標。屬性與關鍵字不帶旗標——散文、圖文講的是形式，
 * 關鍵字講的是專有名詞，兩者都不是「這本書關於什麼」。
 */

/**
 * 主題樹。書、文章、書寫共用同一套分類——子類型就是子節點，深度不限兩層，
 * 書寫沒有子類型，掛在頂層節點就好。
 */
export const topics = pgTable("domain_topics", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id").references((): AnyPgColumn => topics.id, { onDelete: "cascade" }), // 刪掉一個類型，底下的子類型跟著走
  name: text("name").notNull(),
  isPrivate: boolean("is_private").notNull().default(false),
});

/** 散文、圖文。講形式，書與文章共用，書寫沒有 */
export const attributes = pgTable(
  "domain_attribute",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
  },
  (t) => [unique().on(t.userId, t.name)],
);

/**
 * app 層的小設定。目前只有私人項目的密碼雜湊。
 *
 * 放資料庫而不是環境變數，是因為使用者要能在畫面上改密碼——環境變數改不了。
 */
export const settings = pgTable(
  "setting_privacy_pwd",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull().default(""),
  },
  (t) => [primaryKey({ columns: [t.userId, t.key] })],
);
