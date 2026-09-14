/**
 * 同名的關鍵字併成一筆。
 *
 * 關鍵字主檔靠名字認人（網址是 /fragments/keywords/<名字>），同一個名字有兩列
 * 就會出現「頭條顯示有摘要那筆、卡片顯示空的那筆」。手動新增一次、維基查詢
 * 又建一筆就會這樣。
 *
 * 留內容最多的那一筆，其餘的關聯改指過去再刪掉。
 *
 * 用法：node scripts/dedupe-keywords.mjs [.env 檔] [--apply]
 */
import { readFileSync } from "fs";
import postgres from "postgres";

const envFile = process.argv[2] ?? ".env.local";
const apply = process.argv.includes("--apply");
const env = readFileSync(envFile, "utf8");
const url = (env.match(/^DIRECT_URL=["']?(.+?)["']?$/m) ??
  env.match(/^DATABASE_URL=["']?(.+?)["']?$/m))[1];

const sql = postgres(url, { ssl: "require" });

const [kind] = await sql`select id from setting_kinds where slug = 'keywords' limit 1`;
if (!kind) {
  console.log("沒有關鍵字這個類型");
  await sql.end();
  process.exit(0);
}

const dupes = await sql`
  select name, count(*)::int as n from domain_fragments
  where kind_id = ${kind.id} group by name having count(*) > 1 order by name`;

console.log(`同名的：${dupes.length} 組`);

for (const { name } of dupes) {
  const rows = await sql`
    select id, body, tags, span, coordinates, created_at
    from domain_fragments where kind_id = ${kind.id} and name = ${name}`;

  // 填了愈多欄的愈完整；一樣多就留先建的
  const score = (r) => [r.body, r.tags, r.span, r.coordinates].filter(Boolean).length;
  const [keep, ...drop] = [...rows].sort(
    (a, b) => score(b) - score(a) || a.created_at - b.created_at,
  );

  console.log(`  ${name}：留 ${keep.id.slice(0, 8)}（${score(keep)} 欄），刪 ${drop.length} 筆`);
  if (!apply) continue;

  for (const row of drop) {
    // 關聯改指到留下的那一筆，兩邊都要換
    await sql`update links_internal set a_id = ${keep.id} where a_id = ${row.id}`;
    await sql`update links_internal set b_id = ${keep.id} where b_id = ${row.id}`;
    await sql`delete from domain_fragments where id = ${row.id}`;
  }
}

console.log(apply ? "\n清完了" : "\n（沒有 --apply，什麼都沒改）");
await sql.end();
