#!/usr/bin/env node
/**
 * 設定頁承諾的東西，資料庫接得住嗎？
 *
 * 模組庫是一套（config/modules.ts），資料表是三張。使用者在設定頁勾什麼都可以，
 * 但勾完存不存得下，取決於那個 group 的表有沒有那一欄——沒有的話勾了無效，
 * 而且完全不報錯。
 *
 * 這支把三層攤開比對：模組庫說要哪些欄位、drizzle schema 宣告了哪些、
 * 資料庫實際有哪些。任何一層對不上就列出來。
 *
 * 用法：
 *   node scripts/audit-modules.mjs          比對 .env.local（測試庫）
 *   node scripts/audit-modules.mjs prod     比對 .env.prod（正式庫）
 */

import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";

const target = process.argv[2] === "prod" ? ".env.prod" : ".env.local";

function readEnv(file) {
  if (!existsSync(file)) return null;
  const out = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = readEnv(target);
if (!env?.DIRECT_URL) {
  console.log(`${target} 沒有 DIRECT_URL，跳過`);
  process.exit(0);
}

/** 模組庫：一個模組佔哪幾個欄位 */
const src = readFileSync("src/config/modules.ts", "utf8");
const modules = [];
const re = /\{\s*key:\s*"(\w+)"[^}]*?label:\s*"([^"]+)"[^}]*?fields:\s*\[([^\]]*)\]/gs;
for (let m; (m = re.exec(src)); ) {
  modules.push({
    key: m[1],
    label: m[2],
    fields: m[3]
      .split(",")
      .map((s) => s.trim().replace(/"/g, ""))
      .filter(Boolean),
  });
}

/** 這幾個不落在自己的欄位上，存在別張表或別的機制 */
const ELSEWHERE = new Set(["links", "externalUrl", "topic", "attribute"]);

/** 一個 group 的資料落在哪幾張表 */
const TABLES = {
  records: ["domain_works", "domain_records"],
  fragments: ["domain_fragments"],
  writings: ["domain_writings"],
};

const snake = (s) => s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());

const sql = postgres(env.DIRECT_URL, { prepare: false, max: 1, connect_timeout: 10 });

try {
  const columns = {};
  for (const table of [...new Set(Object.values(TABLES).flat())]) {
    const rows = await sql`
      select column_name from information_schema.columns where table_name = ${table}`;
    columns[table] = new Set(rows.map((r) => r.column_name));
  }

  const colsOf = (group) => new Set(TABLES[group].flatMap((t) => [...columns[t]]));
  const stored = (set, field) => set.has(snake(field)) || set.has(field);

  console.log(`\n設定頁承諾 vs 資料庫實際（${target}）\n`);
  const holes = [];
  for (const group of Object.keys(TABLES)) {
    const set = colsOf(group);
    for (const mod of modules) {
      if (ELSEWHERE.has(mod.key) || mod.fields.length === 0) continue;
      const missing = mod.fields.filter((f) => !stored(set, f));
      if (missing.length) holes.push({ group, label: mod.label, missing });
    }
  }

  const total = modules.filter((m) => !ELSEWHERE.has(m.key) && m.fields.length).length;
  for (const group of Object.keys(TABLES)) {
    const mine = holes.filter((h) => h.group === group);
    console.log(`  ${group.padEnd(10)} ${total - mine.length}/${total} 個模組存得下`);
    for (const hole of mine) console.log(`      ✖ ${hole.label}（缺 ${hole.missing.join("、")}）`);
  }

  // 使用者真的勾了、卻存不下的——這些是現在就在流失資料的
  const checked = await sql`
    select u.email, k.name, k.group_key, m.field_key
    from setting_map_kind_field m
    join setting_kinds k on k.id = m.kind_id
    join users u on u.id = k.user_id`;
  const byModule = new Map(modules.map((m) => [m.key, m]));
  const broken = new Map();
  for (const row of checked) {
    const mod = byModule.get(row.field_key);
    if (!mod || ELSEWHERE.has(mod.key) || !mod.fields.length) continue;
    const set = colsOf(row.group_key);
    if (mod.fields.every((f) => stored(set, f))) continue;
    const key = `${row.email} / ${row.name}`;
    if (!broken.has(key)) broken.set(key, []);
    broken.get(key).push(mod.label);
  }

  console.log(`\n已經勾了、但存不下的（現在就在流失資料）：`);
  if (broken.size === 0) console.log("  無");
  for (const [who, labels] of broken) console.log(`  ✖ ${who}: ${labels.join("、")}`);

  console.log(`\n合計 ${holes.length} 個洞（${total} 個模組 × 3 個 group）\n`);
  process.exit(holes.length ? 1 : 0);
} finally {
  await sql.end({ timeout: 3 });
}
