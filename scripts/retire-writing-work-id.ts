import postgres from "postgres";

/**
 * 把 domain_writings.work_id 退休成備份欄位。
 *
 * 那是舊的「這則書寫延伸自哪個作品」欄位，關聯已經搬進 links_internal
 * （scripts/migrate-writing-source.ts），讀寫兩端也都切過去了，
 * schema 上已經沒有這一欄。但它是那批關聯唯一的原始來源，直接 DROP 不可逆，
 * 所以改名留著——跟片段那批（retire-work-id.ts）同一套做法。
 *
 * 外鍵要先拆：留著的話刪一本書會被這個沒人用的欄位擋住。
 *
 * 用法：
 *   npx tsx --env-file=.env.local scripts/retire-writing-work-id.ts           乾跑
 *   npx tsx --env-file=.env.local scripts/retire-writing-work-id.ts --apply   真的改
 */

const APPLY = process.argv.includes("--apply");
const NEW_NAME = "_work_id_deprecated_20260915";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL 或 DATABASE_URL 沒設");
const sql = postgres(url, { prepare: false, max: 2 });

async function run() {
  console.log(APPLY ? "== 寫入模式 ==\n" : "== 乾跑，不寫入（要改加 --apply）==\n");
  console.log("資料庫:", new URL(url!).username.split(".")[1] ?? "?", "\n");

  const has = await sql`
    select 1 from information_schema.columns
    where table_name = 'domain_writings' and column_name = 'work_id'`;
  if (has.length === 0) {
    console.log("work_id 已經不在了，不用做");
    return sql.end();
  }

  // 搬乾淨了才准動：沒搬進新表的關聯改完名就沒人讀得到了。
  // 指向已刪作品的不算——那種本來就是死連結，搬過去也連不到東西
  const [{ n }] = (await sql`
    select count(*)::int as n from domain_writings w
    join domain_works k on k.id = w.work_id
    where w.work_id is not null and not exists(
      select 1 from links_internal l
      where l.user_id = w.user_id
        and ((l.a_id = w.id and l.b_id = w.work_id) or (l.b_id = w.id and l.a_id = w.work_id)))`) as [
    { n: number },
  ];

  if (n > 0) {
    console.log(`❌ 還有 ${n} 筆關聯只存在 work_id，沒搬進 links_internal，先不改`);
    return sql.end();
  }

  const [{ total }] = (await sql`
    select count(*)::int as total from domain_writings where work_id is not null`) as [
    { total: number },
  ];
  console.log(`${total} 筆關聯都已經在 links_internal 裡，work_id 可以退休`);
  console.log(`  work_id → ${NEW_NAME}`);

  if (!APPLY) {
    console.log("\n（乾跑結束）");
    return sql.end();
  }

  await sql.unsafe(`
    ALTER TABLE domain_writings
      DROP CONSTRAINT IF EXISTS domain_writings_work_id_domain_works_id_fk`);
  await sql.unsafe(`ALTER TABLE domain_writings RENAME COLUMN work_id TO "${NEW_NAME}"`);

  const after = await sql`
    select column_name from information_schema.columns
    where table_name = 'domain_writings' and column_name = ${NEW_NAME}`;
  console.log(after.length ? `\n✅ 已改名成 ${NEW_NAME}` : "\n❌ 改名沒成功");
  await sql.end();
}

run().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
