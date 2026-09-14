/**
 * 把書寫底下所有類型的「量」欄位拿掉。
 *
 * 字數是內文本身算得出來的，不該叫人自己填——而且 domain_writings 根本沒有
 * amount 欄，填了也存不進去。範本已經改掉，但那只影響之後新建的，既有的類型
 * 還留著這一列。
 *
 * 用法：node scripts/drop-writing-amount.mjs [.env 檔]
 */
import { readFileSync } from "fs";
import postgres from "postgres";

const envFile = process.argv[2] ?? ".env.local";
const env = readFileSync(envFile, "utf8");
const url = (env.match(/^DIRECT_URL=["']?(.+?)["']?$/m) ??
  env.match(/^DATABASE_URL=["']?(.+?)["']?$/m))[1];

const sql = postgres(url, { ssl: "require" });

const before = await sql`
  select k.name, m.field_key
  from setting_map_kind_field m
  join setting_kinds k on k.id = m.kind_id
  where k.group_key = 'writings' and m.field_key = 'amount'`;
console.log(`要拿掉的：${before.length} 列`, before.map((r) => r.name).join("、"));

if (before.length > 0) {
  await sql`
    delete from setting_map_kind_field m
    using setting_kinds k
    where k.id = m.kind_id and k.group_key = 'writings' and m.field_key = 'amount'`;
  console.log("清掉了");
}

console.log(
  "剩下的書寫欄位：",
  await sql`
    select k.name, count(m.id)::int as fields
    from setting_kinds k
    left join setting_map_kind_field m on m.kind_id = k.id
    where k.group_key = 'writings'
    group by k.id, k.name order by k.name`,
);

await sql.end();
