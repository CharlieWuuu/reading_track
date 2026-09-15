// demo 帳號的片段被重複灌了三次（09-05、09-06、09-07），每組留最新的那筆。
//
// 判準不是時間而是「有沒有連到作品」：seed 每次重建片段與連結，舊的片段留著
// 但連結被 cascade 帶走了，所以孤兒就是舊的那幾份。時間只拿來當第二道確認。
import postgres from "postgres";

const apply = process.argv.includes("--apply");
const sql = postgres(process.env.DIRECT_URL!, { prepare: false });

const orphans = await sql`
  select f.id, f.title, to_char(f.created_at, 'MM-DD HH24:MI') created
  from domain_fragments f
  join users u on u.id = f.user_id and u.email = 'demo@archivum.test'
  where not exists (
    select 1 from links_internal l where l.a_id = f.id or l.b_id = f.id
  )
  order by f.created_at, f.title`;

for (const row of orphans) console.log(`${row.created}  ${String(row.title).slice(0, 40)}`);

if (apply && orphans.length) {
  await sql`delete from domain_fragments where id in ${sql(orphans.map((r) => r.id))}`;
  console.log(`\n已刪除 ${orphans.length} 筆`);
} else {
  console.log(`\n${orphans.length} 筆待刪（加 --apply 執行）`);
}

await sql.end();
