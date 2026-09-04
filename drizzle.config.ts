import { defineConfig } from "drizzle-kit";

// 本地開發指向 supabase start 起的那份，正式環境用 .env.local 的連線字串蓋掉。
// 用 DIRECT_URL 而不是 DATABASE_URL：DDL 要直連，走交易模式的 pooler 會失敗
export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  },
  casing: "snake_case",
});
