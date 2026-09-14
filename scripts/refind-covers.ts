import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { searchBooks } from "@/lib/metadata";

/**
 * 幫還是外部網址的封面另外找一張。
 *
 * ingest-covers 搬不動的那幾張是防盜連（誠品回 403）——那些圖在瀏覽器裡本來
 * 也是破的。既然原本就看不到，就照書名重新搜一張能用的，抓得到就搬進 bucket。
 *
 * 用法：
 *   npx tsx --env-file=.env.prod scripts/refind-covers.ts           乾跑，只印找到什麼
 *   npx tsx --env-file=.env.prod scripts/refind-covers.ts --apply   真的寫入
 *
 * 書名對不上就跳過，不猜——寧可留著壞連結，也不要換成別本書的封面。
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

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** 比對書名用：版次、標點、空白都不算數 */
const norm = (s: string) =>
  s
    .replace(/[（(【[][^）)】\]]*(版|冊|紀念|典藏|精裝|平裝|套書)[^）)】\]]*[）)】\]]/g, "")
    .replace(/[\s：:，,。．・\-—–()（）【】《》〈〉!！?？]/g, "")
    .toLowerCase();

async function ingest(userId: string, url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const type = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    const ext = TYPES[type];
    if (!ext) return null;
    const blob = await res.blob();
    if (blob.size === 0 || blob.size > 5 * 1024 * 1024) return null;
    const key = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await storage.upload(key, blob, { contentType: type, upsert: false });
    return error ? null : key;
  } catch {
    return null;
  }
}

async function run() {
  console.log(APPLY ? "== 寫入模式 ==\n" : "== 乾跑，不寫入（要寫加 --apply）==\n");

  const rows: { id: string; user_id: string; title: string; creator: string }[] = await sql`
    select id, user_id, title, creator from domain_works
    where cover_url like 'http%' order by title`;

  let fixed = 0;
  for (const row of rows) {
    const hits = await searchBooks(row.title).catch(() => []);
    // 書名對得上、而且真的有封面的才算數
    const hit = hits.find(
      (h) => h.coverUrl && norm(h.title ?? "").includes(norm(row.title).slice(0, 8)),
    );

    if (!hit?.coverUrl) {
      console.log(`✗ ${row.title} — 找不到對得上的`);
      continue;
    }
    console.log(`✓ ${row.title}\n    ${hit.source}: ${hit.coverUrl.slice(0, 70)}`);
    if (!APPLY) continue;

    const key = await ingest(row.user_id, hit.coverUrl);
    if (!key) {
      console.log(`    ✗ 這張也抓不到，原網址留著`);
      continue;
    }
    await sql`update domain_works set cover_url = ${key} where id = ${row.id}`;
    fixed++;
  }

  console.log(APPLY ? `\n換掉 ${fixed} 張` : "\n（乾跑結束）");
  await sql.end();
}

run().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
