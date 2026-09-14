import { boolean, integer, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { fields } from "./fields";
import { users } from "./users";

/**
 * 類型的定義。書籍、文章、電影、Podcast、線上課程——每一種是一列，不是一張表。
 *
 * 舊的作法是類型＝表名，所以多一種就要開表、寫 query、寫頁面，側欄那幾列才會寫死。
 * 這裡把類型降成資料，使用者自己新增一種也走同一條路，沒有二等公民。
 *
 * user_id 是「誰建的」，NULL 代表系統預設。「誰在用」是另一回事，
 * 記在 setting_user_kinds——所以預設類型也能關掉，不影響其他人。
 *
 * 注意跟 topics 不是同一層：那張是主題樹（文學、歷史），這張是「這是哪一種東西」。
 */
export const kinds = pgTable(
  "setting_kinds",
  {
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** 網址上的那一段，人工填、英文小寫連字號。/records/<slug> 走它，不走 id */
    slug: text("slug").notNull(),
    /** 屬於側欄哪個 group：records／fragments／writings。三個 group 共用同一套類型機制 */
    groupKey: text("group_key").notNull(),
    /** 量的單位：頁、分鐘、字。統計讀「量＋單位」自己長句子，加類型不用改統計 */
    amountUnit: text("amount_unit").notNull().default(""),
    /** @deprecated 排序搬到 setting_user_kinds 了——共用列上調順序會動到所有人。查詢全切過去後刪掉 */
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    unique().on(t.userId, t.groupKey, t.name), // 同一個 group 底下名字不重複
    unique().on(t.userId, t.groupKey, t.slug), // 網址也不重複
  ],
);

/**
 * 這個使用者在用哪些類型，以及自己排的順序。
 *
 * setting_kinds 是目錄——書籍、文章、電影長什麼樣，全站共用一份定義。
 * 「我在用哪幾種」「側欄要照什麼順序排」是各人的事，記在這裡。
 *
 * 分開的理由是刪除：把「書籍」關掉只是從這張表移掉一列，目錄那份定義不動，
 * 也不影響別人。想再用就插回來，刪除永遠可逆。
 *
 * sort_order 也在這裡不在 setting_kinds：那張是共用的，一個人調順序會動到所有人。
 */
export const userKinds = pgTable(
  "setting_user_kinds",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kindId: uuid("kind_id")
      .notNull()
      .references(() => kinds.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.userId, t.kindId)], // 同一種類型不會用兩次
);

/**
 * 類型與欄位的關聯：這個類型勾了哪個欄位、顯不顯示、叫什麼名字。
 *
 * 沒有「特有欄位」——作者、導演、講師、主持人都是創作者，頁數、片長、集數都是份量。
 * 所以這張表只改名字與可見性，records 的欄位一動也不動。想不到的類型也有位置放。
 *
 * field_key 對到 records／experiences 上真正的欄位，合法值由 config 那層管。
 * 名字本身走 field_id 指到 fields，不在這裡重複存字串。
 */
export const mapKindField = pgTable(
  "setting_map_kind_field",
  {
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    id: uuid("id").primaryKey().defaultRandom(),
    kindId: uuid("kind_id")
      .notNull()
      .references(() => kinds.id, { onDelete: "cascade" }),
    fieldKey: text("field_key").notNull(),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => fields.id, { onDelete: "restrict" }),
    isVisible: boolean("is_visible").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.kindId, t.fieldKey)], // 一個欄位在一個類型只講一次
);
