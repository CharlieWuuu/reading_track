import postgres from "postgres";

/**
 * 把掛在「某一次紀錄」上的站內關聯改掛到作品上。
 *
 * 關聯的兩端不分方向，但書籍有兩個編號：作品是這本書本身，紀錄是「我讀它」
 * 那一次。掛在紀錄上的話，同一本書讀兩次，連過來的佳句與心得會跟著哪一次分家，
 * 表單拿作品編號去查也查不到——通用表單一律掛作品，這批是修正之前留下的。
 *
 * 換完可能跟既有的那條重複（同一組兩端已經連過），那就直接刪掉這條。
 *
 * 用法：
 *   npx tsx --env-file=.env.local scripts/relink-to-work.ts           乾跑
 *   npx tsx --env-file=.env.local scripts/relink-to-work.ts --apply   真的改
 */

const APPLY = process.argv.includes("--apply");

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL 或 DATABASE_URL 沒設");
const sql = postgres(url, { prepare: false, max: 2 });

type Row = {
  id: string;
  userId: string;
  aId: string;
  bId: string;
  recordId: string;
  workId: string;
  title: string;
};

async function run() {
  console.log(APPLY ? "== 寫入模式 ==\n" : "== 乾跑，不寫入（要改加 --apply）==\n");
  console.log("資料庫:", new URL(url!).username.split(".")[1] ?? "?", "\n");

  const rows = (await sql`
    select l.id, l.user_id as "userId", l.a_id as "aId", l.b_id as "bId",
           d.id as "recordId", d.work_id as "workId", w.title
    from links_internal l
    join domain_records d on d.id = l.a_id or d.id = l.b_id
    join domain_works w on w.id = d.work_id`) as unknown as Row[];

  console.log(`掛在紀錄上的關聯: ${rows.length} 條\n`);
  for (const row of rows) console.log(`  ${row.title}`);

  if (!APPLY) {
    console.log("\n（乾跑結束）");
    return sql.end();
  }

  let moved = 0;
  let dropped = 0;
  for (const row of rows) {
    // 這一條的另一端：不是紀錄的那個就是對方
    const other = row.aId === row.recordId ? row.bId : row.aId;

    const [existing] = await sql`
      select 1 from links_internal
      where user_id = ${row.userId}
        and ((a_id = ${row.workId} and b_id = ${other})
          or (a_id = ${other} and b_id = ${row.workId}))`;

    if (existing) {
      // 作品那端早就連過了，這條換過去只會變成重複
      await sql`delete from links_internal where id = ${row.id}`;
      dropped += 1;
      continue;
    }

    await sql`update links_internal
      set a_id = ${row.workId}, b_id = ${other}
      where id = ${row.id}`;
    moved += 1;
  }

  const [{ left }] = (await sql`
    select count(*)::int as left from links_internal l
    join domain_records d on d.id = l.a_id or d.id = l.b_id`) as [{ left: number }];

  console.log(`\n✅ 改掛 ${moved} 條，刪掉重複的 ${dropped} 條`);
  console.log(left === 0 ? "沒有關聯掛在紀錄上了" : `❌ 還有 ${left} 條掛在紀錄上`);
  await sql.end();
}

run().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
