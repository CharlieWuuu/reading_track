import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { assignNames, buildFiles, type ExportEntry } from "../src/utils/obsidian-export";
import { renderStats, shelfBase } from "../src/utils/obsidian-views";

/**
 * 把一個帳號的作品、片段、書寫匯出成 Obsidian 筆記。單向：archivum 是正本，
 * 匯出目錄每次整個重寫，在那邊改的會被蓋掉。
 *
 * 只讀不寫：整段包在 read only 交易裡。私密的也匯出，frontmatter 標 private: true——
 * vault 只有本人看得到，私密密碼是給 archivum 畫面用的。
 *
 * 用法：
 *   npx tsx --env-file=.env.prod scripts/export-obsidian.mts <email> <匯出目錄> [--limit-books=5]
 */

const [email, outDir] = process.argv.slice(2);
const limitArg = process.argv.find((a) => a.startsWith("--limit-books="));
const LIMIT_BOOKS = limitArg ? Number(limitArg.split("=")[1]) : null; // 試做用：只匯最新幾本與連到它們的資料
if (!email || !outDir) throw new Error("用法：export-obsidian.mts <email> <匯出目錄>");

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL 或 DATABASE_URL 沒設");
const sql = postgres(url, { prepare: false, max: 1 });

const splitTags = (s: string) =>
  s
    .split(/[、,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
const day = (d: string | null) => d ?? null;

const data = await sql.begin("read only", async (t) => {
  const [user] = await t`select id from users where email = ${email}`;
  if (!user) throw new Error(`找不到帳號 ${email}`);
  const uid = user.id as string;

  const works = await t`
    select w.id, k.name kind, w.title, w.body, w.creator, w.publisher, w.language, w.amount,
           w.translation, w.start_year, w.end_year, w.tags, w.cover_url, tp.name topic, a.name attribute
    from domain_works w
    join setting_kinds k on k.id = w.kind_id
    left join domain_record_topic tp on tp.id = w.topic_id
    left join domain_attribute a on a.id = w.attribute_id
    where w.user_id = ${uid}`;
  const records = await t`
    select r.id, r.work_id, r.is_private, r.start_date::text s, r.end_date::text e, p.name platform
    from domain_records r left join domain_platform p on p.id = r.platform_id
    where r.user_id = ${uid}
    order by r.start_date nulls last`;
  const fragments = await t`
    select f.id, f.is_private, k.name kind, f.title, f.body, f.locator, f.pronunciation, f.translation, f.creator,
           f.start_year, f.end_year, f.latitude, f.longitude, f.tags, f.created_at::date::text created,
           tp.name topic
    from domain_fragments f
    join setting_kinds k on k.id = f.kind_id
    left join domain_record_topic tp on tp.id = f.topic_id
    where f.user_id = ${uid}`;
  const writings = await t`
    select wr.id, wr.is_private, k.name kind, wr.title, wr.body, wr.end_date::text e, wr.tags,
           wr.created_at::date::text created, tp.name topic
    from domain_writings wr
    join setting_kinds k on k.id = wr.kind_id
    left join domain_record_topic tp on tp.id = wr.topic_id
    where wr.user_id = ${uid}`;
  const links = await t`select a_id, b_id from links_internal where user_id = ${uid}`;
  const urls = await t`
    select coalesce(record_id, fragment_id, writing_id) owner, url, label
    from links_external where user_id = ${uid} order by sort_order`;
  return { works, records, fragments, writings, links, urls };
});
await sql.end();

// 紀錄的連結與站內關聯都歸到作品上——Obsidian 那邊一本書一個檔，不分讀第幾次
const recordToWork = new Map(data.records.map((r) => [r.id as string, r.work_id as string]));
const toOwner = (id: string) => recordToWork.get(id) ?? id;
const urlsOf = data.urls.reduce((m, u) => {
  const owner = toOwner(u.owner);
  return m.set(owner, [...(m.get(owner) ?? []), u.label ? `[${u.label}](${u.url})` : u.url]);
}, new Map<string, string[]>());
const readsOf = data.records.reduce(
  (m, r) =>
    m.set(r.work_id, [
      ...(m.get(r.work_id) ?? []),
      { start: day(r.s), end: day(r.e), platform: r.platform ?? "" },
    ]),
  new Map<string, ExportEntry["reads"]>(),
);
const links = data.links.map((l) => [toOwner(l.a_id), toOwner(l.b_id)] as [string, string]);

const base = { urls: [] as string[], reads: [] as ExportEntry["reads"] };
// 封面在私有 bucket，簽名網址會過期，所以下載進 vault；外部網址照用
const COVER_DIR = "封面";
const coverFile = (key: string) => key.split("/").pop()!;
const coverRef = (key: string) =>
  !key ? null : /^https?:/.test(key) ? key : `[[${coverFile(key)}]]`;
const lastRead = (reads: ExportEntry["reads"]) =>
  reads
    .map((r) => r.end ?? r.start ?? "")
    .sort()
    .at(-1) || null;
const statusOf = (reads: ExportEntry["reads"]) =>
  !reads.length ? null : reads.some((r) => r.start && !r.end) ? "閱讀中" : "讀完";
const privateWorks = new Set(
  [...Map.groupBy(data.records, (r) => r.work_id as string)]
    .filter(([, rs]) => rs.every((r) => r.is_private)) // 每次紀錄都私密，作品才算私密
    .map(([id]) => id),
);
const works: ExportEntry[] = data.works.map((w) => ({
  ...base,
  id: w.id,
  kind: w.kind,
  title: w.title,
  body: w.body,
  meta: {
    creator: w.creator,
    publisher: w.publisher,
    language: w.language,
    translation: w.translation,
    amount: w.amount,
    start_year: w.start_year,
    end_year: w.end_year,
    topic: w.topic,
    attribute: w.attribute,
    cover: coverRef(w.cover_url),
    last_read: lastRead(readsOf.get(w.id) ?? []),
    status: statusOf(readsOf.get(w.id) ?? []),
    private: privateWorks.has(w.id) || null,
  },
  tags: splitTags(w.tags),
  urls: urlsOf.get(w.id) ?? [],
  reads: readsOf.get(w.id) ?? [],
}));
const fragments: ExportEntry[] = data.fragments.map((f) => ({
  ...base,
  id: f.id,
  kind: f.kind,
  title: f.title,
  body: f.body,
  meta: {
    locator: f.locator,
    pronunciation: f.pronunciation,
    translation: f.translation,
    creator: f.creator,
    start_year: f.start_year,
    end_year: f.end_year,
    latitude: f.latitude,
    longitude: f.longitude,
    topic: f.topic,
    created: f.created,
    private: f.is_private || null,
  },
  tags: splitTags(f.tags),
  urls: urlsOf.get(f.id) ?? [],
}));
const writings: ExportEntry[] = data.writings.map((w) => ({
  ...base,
  id: w.id,
  kind: w.kind,
  title: w.title,
  body: w.body,
  meta: { finished: w.e, topic: w.topic, created: w.created, private: w.is_private || null },
  tags: splitTags(w.tags),
  urls: urlsOf.get(w.id) ?? [],
}));

const latestBooks = (n: number) => {
  const last = (e: ExportEntry) =>
    e.reads
      .map((r) => r.end ?? r.start ?? "")
      .sort()
      .at(-1) ?? "";
  const books = works
    .filter((w) => w.kind === "書籍")
    .sort((a, b) => last(b).localeCompare(last(a)))
    .slice(0, n);
  const keep = new Set(books.map((b) => b.id));
  links.forEach(([a, b]) => (keep.has(a) || keep.has(b)) && [a, b].forEach((id) => keep.add(id)));
  return [...works, ...fragments, ...writings].filter(
    (e) => keep.has(e.id) && (e.kind !== "書籍" || books.includes(e)),
  );
};

const entries = LIMIT_BOOKS ? latestBooks(LIMIT_BOOKS) : [...works, ...fragments, ...writings];
const files = [
  ...buildFiles(entries, links),
  renderStats(entries, assignNames(entries), new Date().toISOString().slice(0, 10)),
  shelfBase,
];

// 只清自己產生的子資料夾，匯出目錄裡別的東西不動
const root = path.resolve(outDir);
await mkdir(root, { recursive: true });
const ours = new Set(files.filter((f) => f.path.includes("/")).map((f) => f.path.split("/")[0])); // 根目錄的單檔直接覆寫
const existing = await readdir(root, { withFileTypes: true });
await Promise.all(
  existing
    .filter((d) => d.isDirectory() && ours.has(d.name))
    .map((d) => rm(path.join(root, d.name), { recursive: true })),
);
await Promise.all([...ours].map((d) => mkdir(path.join(root, d), { recursive: true })));
await Promise.all(files.map((f) => writeFile(path.join(root, f.path), f.content + "\n")));

// 封面只補缺的，不在清除範圍內，下次匯出不用重抓
const coverKeys = [...new Set(data.works.map((w) => w.cover_url as string))].filter(
  (k) => k && !/^https?:/.test(k),
);
await mkdir(path.join(root, COVER_DIR), { recursive: true });
const have = new Set(await readdir(path.join(root, COVER_DIR)));
const missing = coverKeys.filter((k) => !have.has(coverFile(k)));
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (missing.length && supabaseUrl && serviceKey) {
  const bucket = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage.from("images");
  const results = await Promise.all(
    missing.map(async (k) => {
      const { data: blob, error } = await bucket.download(k);
      if (error || !blob) return k;
      await writeFile(
        path.join(root, COVER_DIR, coverFile(k)),
        Buffer.from(await blob.arrayBuffer()),
      );
      return null;
    }),
  );
  const failed = results.filter(Boolean);
  console.log(`封面：新下載 ${missing.length - failed.length}，失敗 ${failed.length}`);
}

const counts = files.reduce(
  (m, f) => m.set(f.path.split("/")[0], (m.get(f.path.split("/")[0]) ?? 0) + 1),
  new Map<string, number>(),
);
console.log(`匯出 ${files.length} 個檔到 ${root}`);
counts.forEach((n, k) => console.log(`  ${k}: ${n}`));
