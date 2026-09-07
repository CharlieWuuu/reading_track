import { boolean, date, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { recordKinds, recordKindStatuses } from "./kinds";
import { attributes, bookTypes } from "./taxonomy";
import { users } from "./users";

/**
 * 作品，以及讀了看了上了它的每一次。
 *
 * 主體是紀錄——側欄那堆講的就是這個。works 是把重複的東西抽出去：一本書讀三次，
 * 書名作者只存一份。二刷不新增作品，只多一筆紀錄。
 *
 * 統計要數的是次數，書架上要看的是本數，合成一層兩邊都算不準。repov 那類 app
 * 一筆＝一次、沒有作品層，重看就是再發一則，我們不走那條。
 */

/**
 * 一個作品。書、文章、電影、Podcast、線上課程都是這張表的一列，靠 kind_id 分。
 *
 * 欄位是共用的：創作者就是作者／導演／講師／主持人，叫什麼名字交給 record_kind_fields。
 *
 * topic_id 指向 book_types——那張表是主題樹（文學、歷史），跟 kind 是兩個層級。
 * 欄位先在這裡正名為 topic，表名之後一起改，免得這步就動到舊查詢。
 */
export const works = pgTable("works", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  id: uuid("id").primaryKey().defaultRandom(),
  kindId: uuid("kind_id")
    .notNull()
    .references(() => recordKinds.id, { onDelete: "restrict" }), // 還有作品掛著就不准刪類型
  title: text("title").notNull(),
  creator: text("creator").notNull().default(""),
  topicId: uuid("topic_id").references(() => bookTypes.id, { onDelete: "set null" }),
  attributeId: uuid("attribute_id").references(() => attributes.id, { onDelete: "set null" }),
  language: text("language").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 一筆紀錄：讀了一次、看了一次、上了一次課。
 *
 * 份量與來源掛在這裡不掛作品：紙本與電子書是不同的一次，頁數與平台跟著那一次走。
 * amount_unit 存在這裡而不是類型上，因為有聲書就是分鐘、紙本就是頁，同一本書都可能。
 *
 * external_id 是外部線索不是身分——ISBN、影片編號、課程網址都塞這裡，只給匯入時
 * 去外面查資料用。比對與帶入一律走內部的 work_id，使用者從自己的紀錄挑一筆就二刷。
 */
export const records = pgTable("records", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  id: uuid("id").primaryKey().defaultRandom(),
  workId: uuid("work_id")
    .notNull()
    .references(() => works.id, { onDelete: "cascade" }),
  statusId: uuid("status_id")
    .notNull()
    .references(() => recordKindStatuses.id, { onDelete: "restrict" }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  amount: integer("amount"), // 頁數／分鐘／集數，單位看下一欄
  amountUnit: text("amount_unit").notNull().default(""),
  source: text("source").notNull().default(""), // 出版社／頻道／平台
  sourceUrl: text("source_url").notNull().default(""),
  externalId: text("external_id").notNull().default(""),
  coverUrl: text("cover_url").notNull().default(""),
  isPrivate: boolean("is_private").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
