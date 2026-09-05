import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * 登入的人。Google 與帳密兩種入口都對到這一張。
 *
 * 認人靠 google_sub 不靠 email——email 換得掉，換掉就對不上同一個人。
 * 兩欄都可空：Google 進來的沒有密碼，demo 帳號沒有 sub。
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  googleSub: text("google_sub").unique(),
  passwordHash: text("password_hash"), // bcrypt，不是 privacy.ts 那個 sha256
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
