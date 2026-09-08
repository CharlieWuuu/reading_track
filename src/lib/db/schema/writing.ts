import { date, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { fragments } from "./fragments";
import { users } from "./users";

/** 專欄的流量。writings 表退場了，metrics 早就指向 fragments，這裡只留這一張 */
export const metrics = pgTable("metrics", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  id: uuid("id").primaryKey().defaultRandom(),
  writingId: uuid("writing_id")
    .notNull()
    .references(() => fragments.id, { onDelete: "cascade" }), // 專欄搬進 fragments 了，編號沒變
  date: date("date").notNull(),
  platform: text("platform").notNull().default(""),
  views: integer("views"),
  reads: integer("reads"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
