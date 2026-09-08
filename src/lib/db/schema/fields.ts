import { pgTable, text, unique, uuid } from "drizzle-orm/pg-core";

/**
 * 欄位的顯示名稱。全體使用者共用一份，同一個 field_key 下相同的字串只存一次——
 * 「作者」「頁數」這種字不分人，不用每個帳號各存一份重複的字串。
 */
export const fields = pgTable(
  "fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fieldKey: text("field_key").notNull(),
    label: text("label").notNull(),
  },
  (t) => [unique().on(t.fieldKey, t.label)],
);
