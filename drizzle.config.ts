import { defineConfig } from "drizzle-kit";

// 本地開發指向 Supabase 的 Archivum_Test，Vercel 用專案環境變數的正式庫。
// 用 DIRECT_URL 而不是 DATABASE_URL：走 session pooler（5432），DDL 在交易模式的 6543 會失敗
const url = process.env.DIRECT_URL;
if (!url) throw new Error("DIRECT_URL 沒設");

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  casing: "snake_case",
});
