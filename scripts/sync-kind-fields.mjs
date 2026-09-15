/**
 * 把既有類型的欄位設定同步成範本現在的樣子。
 *
 * 範本改了只影響之後新建的，既有的類型還留著舊的那組欄位——關鍵字少了學科、
 * 起訖、座標、維基連結，所以通用表單畫不出那幾格，只好另外寫一支專用表單，
 * 於是新增與編輯看到的東西不一樣。
 *
 * 只動範本裡有的那幾種（照 slug 對），自訂類型不碰。
 *
 * 用法：node scripts/sync-kind-fields.mjs [.env 檔] [--apply]
 * 不加 --apply 就只印出會改什麼。
 */
import { readFileSync } from "fs";
import postgres from "postgres";

const envFile = process.argv[2] ?? ".env.local";
const apply = process.argv.includes("--apply");
const env = readFileSync(envFile, "utf8");
const url = (env.match(/^DIRECT_URL=["']?(.+?)["']?$/m) ??
  env.match(/^DATABASE_URL=["']?(.+?)["']?$/m))[1];

/** 從 kind-templates.ts 讀，不要在這裡抄第二份 */
const source = readFileSync("src/config/kind-templates.ts", "utf8");
const TEMPLATES = {};
for (const block of source.split(/\n  \{\n/).slice(1)) {
  const key = block.match(/key: "([^"]+)"/)?.[1];
  const modules = block.match(/modules: \[([\s\S]*?)\]/)?.[1];
  if (!key || !modules) continue;
  const keys = [...modules.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const base = modules.includes("...RECORD_BASE")
    ? ["title", "creator", "link", "progress", "keywords", "private"]
    : [];
  TEMPLATES[key] = [...base, ...keys];
}

/**
 * setting_map_kind_field.field_key 存的是**模組名**不是欄位名——resolveFormModules
 * 拿它去查 moduleDef，查不到就整個丟掉。第一版腳本補了欄位名，那些是查不到的垃圾。
 */
/** 跟範本一樣從原始檔讀，不在這裡抄第二份——抄的那份漏掉新模組時，
 *  新模組會被當成「查不到的垃圾」刪掉，而且刪得無聲無息 */
const LABELS = Object.fromEntries(
  [...readFileSync("src/config/modules.ts", "utf8").matchAll(/key: "([^"]+)", label: "([^"]+)"/g)]
    .map((m) => [m[1], m[2]])
    .concat(
      [
        ...readFileSync("src/config/modules.ts", "utf8").matchAll(
          /\{\s*\n\s*key: "([^"]+)",\s*\n\s*label: "([^"]+)"/g,
        ),
      ].map((m) => [m[1], m[2]]),
    ),
);
if (Object.keys(LABELS).length < 20) throw new Error("模組庫解析失敗，只讀到幾個，先別動資料");

const sql = postgres(url, { ssl: "require" });

const kinds = await sql`select id, user_id, slug, name from setting_kinds order by slug`;

for (const kind of kinds) {
  const wanted = TEMPLATES[kind.slug];
  if (!wanted) continue;

  const current = await sql`
    select field_key from setting_map_kind_field where kind_id = ${kind.id} order by sort_order`;
  const have = current.map((r) => r.field_key);

  const missing = wanted.filter((m) => !have.includes(m));
  // 第一版腳本補進去的欄位名，模組庫查不到，畫面上不會出現也永遠清不掉
  const junk = have.filter((k) => !LABELS[k]);
  if (missing.length === 0 && junk.length === 0) continue;

  if (missing.length) console.log(`${kind.name}（${kind.slug}）缺：${missing.join("、")}`);
  if (junk.length) console.log(`${kind.name}（${kind.slug}）多餘：${junk.join("、")}`);
  if (!apply) continue;

  if (junk.length)
    await sql`
      delete from setting_map_kind_field
      where kind_id = ${kind.id} and field_key in ${sql(junk)}`;

  for (const key of missing) {
    const label = LABELS[key];
    await sql`insert into setting_fields (field_key, label) values (${key}, ${label}) on conflict do nothing`;
    const [field] =
      await sql`select id from setting_fields where field_key = ${key} and label = ${label} limit 1`;
    await sql`
      insert into setting_map_kind_field (user_id, kind_id, field_key, field_id, is_visible, sort_order)
      values (${kind.user_id}, ${kind.id}, ${key}, ${field.id}, true, ${wanted.indexOf(key)})
      on conflict do nothing`;
  }
}

console.log(apply ? "\n補完了" : "\n（沒有 --apply，什麼都沒改）");
await sql.end();
