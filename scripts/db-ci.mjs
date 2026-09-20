#!/usr/bin/env node
/**
 * 部署前把 migration 跑完。跑不過就讓 build 失敗，不要部署。
 *
 * 存在的理由：0016 與 0017 都是「程式碼上去了、schema 沒跟上」才爆的，
 * 而補救全靠有人記得手動跑。只要還有「人要記得」這一步，同樣的事就會再來一次。
 * 這支讓它從結構上不可能發生——schema 沒跟上，程式碼就上不去。
 *
 * 跟 scripts/db.mjs 分開：那支給本機用，讀 .env 檔、會問 yes；
 * CI 沒有那些檔案，環境變數直接由平台給，也沒有人可以回答問題。
 *
 * DIRECT_URL 優先，沒有就退回 DATABASE_URL：drizzle 建議 DDL 走 session pooler
 * （5432），但部署平台上常常只設了 DATABASE_URL。兩個都沒有才跳過——
 * 第一版只認 DIRECT_URL 而且靜默跳過，結果連推兩次都沒跑到，
 * 而 build log 只有一行「跳過」，沒人會注意。
 */
import { execFileSync } from "node:child_process";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!url) {
  // preview 部署、別人 fork 的 CI——不是每一種 build 都連得到資料庫。
  // 講清楚是「兩個都沒設」，不然看到「跳過」會以為是刻意的
  console.log("DIRECT_URL 與 DATABASE_URL 都沒設，跳過 migration");
  process.exit(0);
}

const which = process.env.DIRECT_URL ? "DIRECT_URL" : "DATABASE_URL";
const project = (() => {
  try {
    return new URL(url).username.split(".")[1] ?? "(不明)";
  } catch {
    return "(解不出來)";
  }
})();

console.log(`跑 migration：${project}（走 ${which}）`);

try {
  // drizzle.config.ts 讀 DIRECT_URL，所以退回 DATABASE_URL 時要補進去
  execFileSync("npx", ["drizzle-kit", "migrate"], {
    stdio: "inherit",
    env: { ...process.env, DIRECT_URL: url },
  });
  console.log("migration 完成");
} catch {
  // execFileSync 自己會把 drizzle 的輸出印出來，這裡只補一句「為什麼 build 停了」
  console.error("\n✖ migration 失敗，中止 build——schema 沒跟上就不該部署");
  process.exit(1);
}
