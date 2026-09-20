#!/usr/bin/env node
/**
 * schema 改了，但沒產生對應的 migration？
 *
 * `db:generate` 是唯一還需要人記得的一步——它把 TypeScript 的 schema 差異寫成
 * SQL 檔，而那個檔案要 commit 進版本庫，CI 沒辦法代勞。
 *
 * 「人要記得」就是這些事故的共同根因（0016 全站 502、0017 新增失效），
 * 所以這支負責提醒：schema 檔動過、migration 卻沒有新的，推之前先問一句。
 *
 * 比對的是「與 origin/main 的差異」而不是工作目錄——要擋的是「推上去會不會壞」。
 */
import { execFileSync } from "node:child_process";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();

/** 推上去之後、遠端還沒有的那些 commit 動了哪些檔案 */
let changed;
try {
  const base = git("merge-base", "HEAD", "origin/main");
  changed = git("diff", "--name-only", `${base}..HEAD`).split("\n").filter(Boolean);
} catch {
  // 第一次推、或沒有 origin/main 可比——沒有基準就不猜
  process.exit(0);
}

const touchedSchema = changed.filter((path) => path.startsWith("src/lib/db/schema/"));
const newMigration = changed.filter(
  (path) => path.startsWith("supabase/migrations/") && path.endsWith(".sql"),
);

if (touchedSchema.length === 0 || newMigration.length > 0) process.exit(0);

console.error("\n✖ schema 改了，但沒有新的 migration：");
for (const path of touchedSchema) console.error(`    ${path}`);
console.error(
  "\n  跑：npm run db:generate" +
    "\n  產生出來的 SQL 要一起 commit——部署時靠它把資料庫改成新的形狀。" +
    "\n  只是改註解或型別別名的話，用 --no-verify 跳過。\n",
);
process.exit(1);
