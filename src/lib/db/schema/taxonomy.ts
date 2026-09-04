import { AnyPgColumn, boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";

/**
 * 標記類的表。書、文章、書寫都靠這幾張分類。
 *
 * 私人旗標放在這裡而不是每一筆資料上：想藏的是「政治」「日記」這種主題，
 * 標一次就好，不用一本一本標。屬性不帶旗標——散文、圖文講的是形式，不敏感。
 */

/** 書與文章的類型樹。子類型就是子節點，深度不限兩層 */
export const bookTypes = pgTable("book_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id").references((): AnyPgColumn => bookTypes.id, { onDelete: "cascade" }), // 刪掉一個類型，底下的子類型跟著走
  name: text("name").notNull(),
  isPrivate: boolean("is_private").notNull().default(false),
});

/** 書寫的類型。平的一層，沒有子類型 */
export const writingTypes = pgTable("writing_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  isPrivate: boolean("is_private").notNull().default(false),
});

/** 散文、圖文。講形式，書與文章共用，書寫沒有 */
export const attributes = pgTable("attributes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

/** 專有名詞。名字就是身分，關聯表用 on update cascade 接改名 */
export const keywords = pgTable("keywords", {
  name: text("name").primaryKey(),
  topics: text("topics").notNull().default(""), // 維基主題，多個以頓號相接
  coordinates: text("coordinates").notNull().default(""), // "25.033,121.565"
  span: text("span").notNull().default(""), // 生卒或起訖
  wikiUrl: text("wiki_url").notNull().default(""),
  summary: text("summary").notNull().default(""),
  isPrivate: boolean("is_private").notNull().default(false),
});

/**
 * app 層的小設定。目前只有私人項目的密碼雜湊。
 *
 * 放資料庫而不是環境變數，是因為使用者要能在畫面上改密碼——環境變數改不了。
 */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});
