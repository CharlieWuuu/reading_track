import { pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * 欄位的顯示名稱。同一個 field_key 下相同的名字只存一次，
 * map_kind_field 指過來就好，不用每個類型各存一份重複的字串。
 */
export const fields = pgTable(
  "fields",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    id: uuid("id").primaryKey().defaultRandom(),
    fieldKey: text("field_key").notNull(),
    label: text("label").notNull(),
  },
  (t) => [unique().on(t.userId, t.fieldKey, t.label)],
);
