import crypto from "crypto";
import { readFileSync } from "fs";
import postgres from "postgres";

/**
 * 讓 drizzle 的遷移紀錄跟現在的 migrations 資料夾對齊。
 *
 * 症狀：`drizzle-kit migrate` 跑完看起來成功，欄位其實沒建，而且不報錯。
 * 原因是 `drizzle.__drizzle_migrations` 裡那幾筆來自舊的 `drizzle/` 資料夾
 * （時間戳 1788…），跟現在 `supabase/migrations/` 的檔案（1789…）hash 全對不上，
 * drizzle 判斷「沒事可做」就結束。
 *
 * 這支把舊紀錄換成 journal 那幾支的 hash。已經反映在 schema 上的標記成已套用，
 * 還沒套用的留白，之後 `drizzle-kit migrate` 才會真的去跑它。
 *
 * 用法：
 *   npx tsx --env-file=.env.local scripts/realign-migrations.ts           乾跑
 *   npx tsx --env-file=.env.local scripts/realign-migrations.ts --apply   真的改
 */

const APPLY = process.argv.includes("--apply");

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL 或 DATABASE_URL 沒設");
const sql = postgres(url, { prepare: false, max: 2 });

/**
 * 已經反映在 schema 上的，標記成已套用。
 *
 * 0001 不在裡面：它要 DROP domain_fragments.work_id，那個欄位還在，
 * 關聯已經搬進 links_internal 了，所以留給 drizzle 去跑。
 */
const ALREADY_APPLIED = [
  "0000_init",
  "0002_shallow_gamma_corps",
  "0003_rare_norrin_radd",
  "0004_deep_omega_flight",
];

const hashOf = (tag: string) =>
  crypto
    .createHash("sha256")
    .update(readFileSync(`supabase/migrations/${tag}.sql`, "utf8"))
    .digest("hex");

async function run() {
  console.log(APPLY ? "== 寫入模式 ==\n" : "== 乾跑，不寫入（要改加 --apply）==\n");

  const journal = JSON.parse(readFileSync("supabase/migrations/meta/_journal.json", "utf8")) as {
    entries: { tag: string; when: number }[];
  };

  const stale: { hash: string; created_at: string }[] =
    await sql`select hash, created_at from drizzle.__drizzle_migrations order by created_at`;

  const wanted = new Set(journal.entries.map((e) => hashOf(e.tag)));
  const toDelete = stale.filter((row) => !wanted.has(row.hash));

  console.log(`資料庫現有 ${stale.length} 筆，其中對不上現在資料夾的 ${toDelete.length} 筆`);
  for (const e of journal.entries) {
    const applied = ALREADY_APPLIED.includes(e.tag);
    console.log(`  ${applied ? "標記已套用" : "留給 drizzle 跑"}：${e.tag}`);
  }

  if (!APPLY) {
    console.log("\n（乾跑結束）");
    return sql.end();
  }

  // 一筆一筆刪已知的那幾筆，不整表清空
  for (const row of toDelete) {
    await sql`delete from drizzle.__drizzle_migrations where hash = ${row.hash}`;
  }

  for (const e of journal.entries) {
    if (!ALREADY_APPLIED.includes(e.tag)) continue;
    const hash = hashOf(e.tag);
    const exists = await sql`select 1 from drizzle.__drizzle_migrations where hash = ${hash}`;
    if (exists.length === 0) {
      await sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${hash}, ${e.when})`;
    }
  }

  const after = await sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
  console.log(`\n完成，現在紀錄 ${after[0].n} 筆。接著跑 drizzle-kit migrate 套用剩下那支`);
  await sql.end();
}

run().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
