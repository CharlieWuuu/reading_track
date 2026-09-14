/**
 * 補回類型的欄位設定。
 *
 * 舊資料搬進新 schema 時只 insert 了 setting_kinds，沒碰 setting_map_kind_field——
 * 走 addKind() 會兩張表一起寫，直接下 SQL 就繞過了那段。結果是側欄看得到「思緒」，
 * 點進去表單一個欄位都沒有。
 *
 * 有範本的照範本補；自訂的沒有依據，給該 group 的通用組合。
 * 已經有欄位的類型跳過，不覆蓋任何人自己調過的設定。
 *
 * 用法：node scripts/backfill-kind-fields.mjs [.env 檔]
 */
import { readFileSync } from "fs";
import postgres from "postgres";

const envFile = process.argv[2] ?? ".env.local";
const env = readFileSync(envFile, "utf8");
const url = (env.match(/^DIRECT_URL=["']?(.+?)["']?$/m) ??
  env.match(/^DATABASE_URL=["']?(.+?)["']?$/m))[1];

// 範本庫是 TypeScript，這裡抄一份需要的部分——只讀不寫，走 tsx 反而多一層依賴
const TEMPLATES = {
  reflection: ["title", "longText", "source", "date", "keywords", "amount", "private"],
  thoughts: ["title", "longText", "date", "keywords", "amount", "private"],
  "weekly-plan": ["title", "longText", "date", "private"],
  essay: ["title", "longText", "link", "date", "keywords", "amount", "private"],
  plan: ["title", "longText", "date", "private"],
};

/** 沒有範本的自訂類型用這組。長文為主，是書寫共通的形狀 */
const FALLBACK = {
  records: ["title", "creator", "link", "progress", "keywords", "private"],
  fragments: ["title", "oneLine", "source", "locator", "date", "private"],
  writings: ["title", "longText", "date", "keywords", "amount", "private"],
};

/** 模組庫的預設名稱，label 不能是空的 */
const LABELS = {
  title: "標題",
  longText: "長文",
  oneLine: "原文",
  gloss: "一句話說明",
  source: "出處",
  locator: "位置",
  date: "單一日期",
  link: "外部連結",
  keywords: "關鍵字",
  amount: "量",
  private: "私人",
  progress: "狀態",
  creator: "作者",
  cover: "封面圖",
};

const sql = postgres(url, { ssl: "require" });

const empty = await sql`
  select k.id, k.user_id, k.slug, k.name, k.group_key
  from setting_kinds k
  left join setting_map_kind_field m on m.kind_id = k.id
  group by k.id
  having count(m.id) = 0
  order by k.slug`;

console.log(`沒有欄位設定的類型：${empty.length} 個`);

for (const kind of empty) {
  const keys = TEMPLATES[kind.slug] ?? FALLBACK[kind.group_key];
  if (!keys) {
    console.log(`  跳過 ${kind.slug}（不認得的 group：${kind.group_key}）`);
    continue;
  }

  for (const [index, key] of keys.entries()) {
    const label = LABELS[key];
    const [field] = await sql`
      insert into setting_fields (field_key, label) values (${key}, ${label})
      on conflict do nothing returning id`;
    const fieldId =
      field?.id ??
      (
        await sql`select id from setting_fields where field_key = ${key} and label = ${label} limit 1`
      )[0].id;

    await sql`
      insert into setting_map_kind_field (user_id, kind_id, field_key, field_id, is_visible, sort_order)
      values (${kind.user_id}, ${kind.id}, ${key}, ${fieldId}, true, ${index})
      on conflict do nothing`;
  }

  const source = TEMPLATES[kind.slug] ? "範本" : "通用";
  console.log(`  ${kind.name}（${kind.slug}）補上 ${keys.length} 個欄位 — ${source}`);
}

console.log("\n剩下沒有欄位的：");
console.log(
  await sql`
    select k.slug, count(m.id)::int as fields
    from setting_kinds k left join setting_map_kind_field m on m.kind_id = k.id
    group by k.id, k.slug having count(m.id) = 0`,
);

await sql.end();
