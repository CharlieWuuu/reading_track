import postgres from "postgres";

/**
 * 把 domain_writings.work_id 搬進 links_internal。
 *
 * 那是「這則書寫延伸自哪個作品」，原本由書寫表單的出處選擇器單獨維護。
 * 表單要併進站內關聯那一格，所以關聯本身得先搬到 links_internal，
 * 不然併完那 33 筆出處就沒人讀得到了——片段那批（retire-work-id）同一套順序。
 *
 * a_id／b_id 不分方向，已經連過的不重插。
 *
 * 用法：
 *   npx tsx --env-file=.env.local scripts/migrate-writing-source.ts           乾跑
 *   npx tsx --env-file=.env.local scripts/migrate-writing-source.ts --apply   真的寫
 */

const APPLY = process.argv.includes("--apply");

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL 或 DATABASE_URL 沒設");
const sql = postgres(url, { prepare: false, max: 2 });

type Pending = { id: string; userId: string; workId: string; name: string; title: string };

async function run() {
  console.log(APPLY ? "== 寫入模式 ==\n" : "== 乾跑，不寫入（要改加 --apply）==\n");
  console.log("資料庫:", new URL(url!).username.split(".")[1] ?? "?", "\n");

  // 出處指到的作品要真的還在：指向已刪作品的那幾筆搬過去也是死連結
  const pending = (await sql`
    select w.id, w.user_id as "userId", w.work_id as "workId", w.name, k.title
    from domain_writings w
    join domain_works k on k.id = w.work_id
    where w.work_id is not null and not exists(
      select 1 from links_internal l
      where l.user_id = w.user_id
        and ((l.a_id = w.id and l.b_id = w.work_id) or (l.b_id = w.id and l.a_id = w.work_id)))
    order by w.name`) as unknown as Pending[];

  const [{ total }] = (await sql`
    select count(*)::int as total from domain_writings where work_id is not null`) as [
    { total: number },
  ];
  const [{ dangling }] = (await sql`
    select count(*)::int as dangling from domain_writings w
    where w.work_id is not null
      and not exists(select 1 from domain_works k where k.id = w.work_id)`) as [
    { dangling: number },
  ];

  console.log(`有出處的書寫: ${total} 筆`);
  console.log(`已經在 links_internal: ${total - pending.length - dangling} 筆`);
  console.log(`這次要搬: ${pending.length} 筆`);
  if (dangling > 0) console.log(`指向已刪作品，跳過: ${dangling} 筆`);
  console.log("");

  for (const row of pending) console.log(`  ${row.name}  →  ${row.title}`);

  if (!APPLY) {
    console.log("\n（乾跑結束）");
    return sql.end();
  }

  for (const row of pending) {
    await sql`insert into links_internal (user_id, a_id, b_id)
      values (${row.userId}, ${row.id}, ${row.workId})`;
  }

  const [{ left }] = (await sql`
    select count(*)::int as left from domain_writings w
    join domain_works k on k.id = w.work_id
    where w.work_id is not null and not exists(
      select 1 from links_internal l
      where l.user_id = w.user_id
        and ((l.a_id = w.id and l.b_id = w.work_id) or (l.b_id = w.id and l.a_id = w.work_id)))`) as [
    { left: number },
  ];
  console.log(left === 0 ? `\n✅ 搬完 ${pending.length} 筆` : `\n❌ 還剩 ${left} 筆沒搬`);
  await sql.end();
}

run().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
