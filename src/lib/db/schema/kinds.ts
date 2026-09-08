import { boolean, integer, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * 類型的定義。書籍、文章、電影、Podcast、線上課程——每一種是一列，不是一張表。
 *
 * 舊的作法是類型＝表名，所以多一種就要開表、寫 query、寫頁面，側欄那幾列才會寫死。
 * 這裡把類型降成資料，使用者自己新增一種也走同一條路，沒有二等公民。
 *
 * 注意跟 book_types 不是同一層：那張是主題樹（文學、歷史），這張是「這是哪一種東西」。
 */
export const kinds = pgTable(
  "kinds",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** 屬於側欄哪一堆：records／fragments／writings。三堆共用同一套類型機制 */
    groupKey: text("group_key").notNull(),
    /** 量的單位：頁、分鐘、字。統計讀「量＋單位」自己長句子，加類型不用改統計 */
    amountUnit: text("amount_unit").notNull().default(""),
    /** 側欄與篩選器的排列順序 */
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.userId, t.groupKey, t.name)], // 同一堆底下名字不重複
);

/**
 * 欄位在這個類型叫什麼名字、顯不顯示。
 *
 * 沒有「特有欄位」——作者、導演、講師、主持人都是創作者，頁數、片長、集數都是份量。
 * 所以這張表只改名字與可見性，records 的欄位一動也不動。想不到的類型也有位置放。
 *
 * field_key 對到 records／experiences 上真正的欄位，合法值由 config 那層管。
 */
export const kindFields = pgTable(
  "kind_fields",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    id: uuid("id").primaryKey().defaultRandom(),
    kindId: uuid("kind_id")
      .notNull()
      .references(() => kinds.id, { onDelete: "cascade" }),
    fieldKey: text("field_key").notNull(),
    label: text("label").notNull(), // 「頁數」「片長」「時數」
    isVisible: boolean("is_visible").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.kindId, t.fieldKey)], // 一個欄位在一個類型只講一次
);

/**
 * 狀態的選項。讀完、看完、上完、聽完——講的是同一件事，字不一樣。
 *
 * 一列一筆而不是塞一個陣列欄位：狀態要能排序、能當篩選器的來源。
 */
export const kindStatuses = pgTable(
  "kind_statuses",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    id: uuid("id").primaryKey().defaultRandom(),
    kindId: uuid("kind_id")
      .notNull()
      .references(() => kinds.id, { onDelete: "cascade" }),
    key: text("key").notNull(), // 跨類型比對用的機器名：reading／done／wishlist
    label: text("label").notNull(), // 這個類型講出來的字
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.kindId, t.key)],
);
