import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

/**
 * 測試用的資料庫：記憶體裡的 Postgres，schema 直接灌 supabase/migrations。
 *
 * 寫入那一層以前完全沒有測試，於是「交易沒接 tx」「空日期存不進去」這種問題
 * 只有打真的資料庫才會現形。pglite 是真的 Postgres（編成 wasm），
 * 所以 date 欄位的型別檢查、外鍵、交易語意都跟線上一致。
 */
const MIGRATIONS = path.join(process.cwd(), "supabase/migrations");

export async function makeTestDb() {
  const client = new PGlite();

  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = readFileSync(path.join(MIGRATIONS, file), "utf8");
    // drizzle 產的檔案用這個記號分句，pglite 一次只吃一句
    for (const statement of sql.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (trimmed) await client.exec(trimmed);
    }
  }

  return drizzle(client);
}
