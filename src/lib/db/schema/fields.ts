import { pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * 欄位的顯示名稱。同一個 field_key 下相同的字串只存一次，不用每個類型各存一份。
 *
 * user_id 可空：NULL 代表系統預設的名稱，不是哪個使用者自己打的。
 * 現在寫入時還是每次都帶著呼叫者的 user_id，真的把預設值收斂成 NULL 是之後的事。
 */
export const fields = pgTable(
  "fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    fieldKey: text("field_key").notNull(),
    label: text("label").notNull(),
  },
  (t) => [unique().on(t.fieldKey, t.label)],
);
