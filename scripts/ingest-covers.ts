import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

/**
 * 把既有的外部封面網址搬進自己的 bucket。
 *
 * 轉存只掛在新增那條路上，舊資料還是別人家的網址——對方改版、防盜連、關站，
 * 書單就整排破圖。這支把三張表掃一遍，能抓到的都搬進來。
 *
 * 用法：
 *   node --env-file=.env.local scripts/ingest-covers.ts           乾跑，只印要動幾筆
 *   node --env-file=.env.local scripts/ingest-covers.ts --apply   真的寫入
 *
 * 抓不到的跳過、原網址留著——壞連結比資料不見好。已經是 key 的不動，
 * 所以中斷了再跑一次會接著做完。
 */

const APPLY = process.argv.includes("--apply");

const dbUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DIRECT_URL 或 DATABASE_URL 沒設");

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error("SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 沒設");

const sql = postgres(dbUrl, { prepare: false, max: 2 });
const storage = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
}).storage.from("images");

/** 收得下的格式，跟 utils/image-key 那份一致 */
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 15000;

/** 三張表都是同一件事：user_id 是誰的、cover_url 要搬 */
const TABLES = [
  { name: "domain_works", label: "作品（書籍、文章）" },
  { name: "domain_fragments", label: "片段（佳句、單字、關鍵字）" },
  { name: "domain_writings", label: "書寫" },
] as const;

type Row = { id: string; user_id: string; cover_url: string };

const isExternal = (v: string) => /^https?:\/\//.test(v);

/** 抓回來存進去，回新的 key；任何一步失敗都回 null，呼叫端留著原網址 */
async function ingest(userId: string, url: string): Promise<string | null> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) return null;

  const type = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  const ext = TYPES[type];
  if (!ext) return null;

  const blob = await res.blob();
  if (blob.size === 0 || blob.size > MAX_BYTES) return null;

  const key = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await storage.upload(key, blob, { contentType: type, upsert: false });
  return error ? null : key;
}

async function run() {
  console.log(APPLY ? "== 寫入模式 ==\n" : "== 乾跑，不寫入（要寫加 --apply）==\n");
  let moved = 0;
  let failed = 0;

  for (const table of TABLES) {
    const rows: Row[] = await sql`
      select id, user_id, cover_url from ${sql(table.name)}
      where cover_url like 'http%' order by id`;

    console.log(`${table.label}：${rows.length} 筆要搬`);
    if (!APPLY || rows.length === 0) {
      if (!APPLY) rows.slice(0, 3).forEach((r) => console.log(`    ${r.cover_url.slice(0, 70)}`));
      continue;
    }

    for (const [i, row] of rows.entries()) {
      const key = await ingest(row.user_id, row.cover_url);
      if (key) {
        await sql`update ${sql(table.name)} set cover_url = ${key} where id = ${row.id}`;
        moved++;
      } else {
        failed++;
        console.log(`  ✗ 抓不到，原網址留著：${row.cover_url.slice(0, 70)}`);
      }
      // 一次一張，不要同時開幾百條連線去打別人家的站
      if ((i + 1) % 20 === 0) console.log(`  … ${i + 1}/${rows.length}`);
    }
  }

  console.log(APPLY ? `\n搬進來 ${moved} 張，抓不到 ${failed} 張` : "\n（乾跑結束）");
  await sql.end();
}

run().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
