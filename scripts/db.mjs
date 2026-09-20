#!/usr/bin/env node
/**
 * migration 的單一入口：指令自己說要跑哪個庫，不靠人記得先 source 哪支 .env。
 *
 *   npm run db:migrate         測試庫（.env.local）
 *   npm run db:migrate:prod    正式庫（.env.prod），會先確認
 *   npm run db:check           測試庫，只比對不執行
 *   npm run db:check:prod      正式庫，pre-push 跑這個
 *
 * 存在的理由：0016 與 0017 都是「程式碼推上去了、schema 沒跟上」才爆的。
 * 根因是 package.json 從來沒有 db:migrate——18 支 migration 寫得很完整，
 * 但沒有任何指令會執行它們，資料庫全靠手動貼 SQL 跟上。
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import postgres from "postgres";

const DIR = "supabase/migrations";
const ENV_FILE = { test: ".env.local", prod: ".env.prod" };

const [action, target = "test"] = process.argv.slice(2);
if (!["migrate", "check"].includes(action) || !ENV_FILE[target]) {
  console.error("用法：node scripts/db.mjs <migrate|check> <test|prod>");
  process.exit(2);
}

/** .env 自己讀，不污染整個 shell——source 過的變數會被後面的指令繼承，很難察覺 */
function readEnv(file) {
  if (!existsSync(file)) return null;
  const out = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
    if (!match) continue;
    out[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = readEnv(ENV_FILE[target]);
if (!env?.DIRECT_URL) {
  // 別人 clone 下來沒有正式庫憑證是正常的，不該因此推不了
  console.log(`${ENV_FILE[target]} 沒有 DIRECT_URL，跳過`);
  process.exit(0);
}

const url = env.DIRECT_URL;
const project = new URL(url).username.split(".")[1] ?? "(不明)";

/** 正式庫與測試庫的專案編號寫在這裡，跑錯邊會被擋下來 */
const PROD_REF = "zuixoahjblxkdduligxw";
if (target === "prod" && project !== PROD_REF) {
  console.error(`✖ .env.prod 指的是 ${project}，不是正式庫，停`);
  process.exit(1);
}
if (target === "test" && project === PROD_REF) {
  console.error("✖ .env.local 指到正式庫了，停——這支指令是給測試庫用的");
  process.exit(1);
}

const hashOf = (body) => createHash("sha256").update(body).digest("hex");
const files = readdirSync(DIR)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => ({ name, hash: hashOf(readFileSync(`${DIR}/${name}`, "utf8")) }));

const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 10 });
let pending = [];
try {
  const applied = await sql`
    select hash from drizzle.__drizzle_migrations`.catch(() => []);
  const seen = new Set(applied.map((row) => row.hash));
  pending = files.filter((file) => !seen.has(file.hash));
} finally {
  await sql.end({ timeout: 3 });
}

if (pending.length === 0) {
  console.log(`migration 對得上（${files.length} 支，${target} / ${project}）`);
  process.exit(0);
}

if (action === "check") {
  console.error(`\n✖ 有 ${pending.length} 支還沒跑（${target} / ${project}）：`);
  for (const file of pending) console.error(`    ${file.name}`);
  console.error(
    `\n  跑：npm run db:migrate${target === "prod" ? ":prod" : ""}` +
      "\n  推之前先跑完，不然程式碼會讀到不存在的欄位——0016 就是這樣讓全站 502 的。\n",
  );
  process.exit(1);
}

console.log(`\n要在 ${target} / ${project} 跑 ${pending.length} 支：`);
for (const file of pending) console.log(`    ${file.name}`);

// 正式庫多問一次。改結構是不好回頭的事，多一個 Enter 換一次確認很划算
if (target === "prod" && process.stdin.isTTY) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question("\n這是正式庫，確定？(yes) ");
  rl.close();
  if (answer.trim() !== "yes") {
    console.log("取消");
    process.exit(1);
  }
}

execFileSync("npx", ["drizzle-kit", "migrate"], {
  stdio: "inherit",
  env: { ...process.env, DIRECT_URL: url },
});
