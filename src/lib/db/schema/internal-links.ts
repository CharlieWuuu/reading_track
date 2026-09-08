import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * 站內任兩筆資料互相參照。works／writings／records／fragments 共用這一張，
 * 不分型別——四張表各自 uuid 主鍵，不會撞號，兩端各存一個 id 就夠。
 *
 * 沒有外鍵：a_id／b_id 可能指向四張表的任一張，一個欄位沒辦法同時外鍵四張表。
 * 查詢時用 a_id = X OR b_id = X 撈出所有跟 X 有關的列，對方是哪一種再自己查。
 */
export const internalLinks = pgTable("links_internal", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  id: uuid("id").primaryKey().defaultRandom(),
  aId: uuid("a_id").notNull(),
  bId: uuid("b_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
