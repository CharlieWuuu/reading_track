import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { buildFiles, type ExportEntry } from "../src/utils/obsidian-export";

/**
 * 把一個帳號的作品、片段、書寫匯出成 Obsidian 筆記。單向：archivum 是正本，
 * 匯出目錄每次整個重寫，在那邊改的會被蓋掉。
 *
 * 只讀不寫：整段包在 read only 交易裡。私密的紀錄、片段、書寫不匯出——
 * vault 會同步到 Google Drive 與 GitHub，私密密碼擋不到那裡。
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
           w.translation, w.start_year, w.end_year, w.tags, tp.name topic, a.name attribute
    from domain_works w
    join setting_kinds k on k.id = w.kind_id
    left join domain_record_topic tp on tp.id = w.topic_id and not tp.is_private
    left join domain_attribute a on a.id = w.attribute_id
    where w.user_id = ${uid}`;
  const records = await t`
    select r.id, r.work_id, r.start_date::text s, r.end_date::text e, p.name platform
    from domain_records r left join domain_platform p on p.id = r.platform_id
    where r.user_id = ${uid} and not r.is_private
    order by r.start_date nulls last`;
  const fragments = await t`
    select f.id, k.name kind, f.title, f.body, f.locator, f.pronunciation, f.translation, f.creator,
           f.start_year, f.end_year, f.latitude, f.longitude, f.tags, f.created_at::date::text created,
           tp.name topic
    from domain_fragments f
    join setting_kinds k on k.id = f.kind_id
    left join domain_record_topic tp on tp.id = f.topic_id and not tp.is_private
    where f.user_id = ${uid} and not f.is_private`;
  const writings = await t`
    select wr.id, k.name kind, wr.title, wr.body, wr.end_date::text e, wr.tags,
           wr.created_at::date::text created, tp.name topic
    from domain_writings wr
    join setting_kinds k on k.id = wr.kind_id
    left join domain_record_topic tp on tp.id = wr.topic_id and not tp.is_private
    where wr.user_id = ${uid} and not wr.is_private`;
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
const works: ExportEntry[] = data.works
  .filter((w) => readsOf.has(w.id)) // 紀錄全是私密的作品不匯
  .map((w) => ({
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
  meta: { finished: w.e, topic: w.topic, created: w.created },
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
const files = buildFiles(entries, links);

// 只清自己產生的子資料夾，匯出目錄裡別的東西不動
const root = path.resolve(outDir);
await mkdir(root, { recursive: true });
const ours = new Set(files.map((f) => f.path.split("/")[0]));
const existing = await readdir(root, { withFileTypes: true });
await Promise.all(
  existing
    .filter((d) => d.isDirectory() && ours.has(d.name))
    .map((d) => rm(path.join(root, d.name), { recursive: true })),
);
await Promise.all([...ours].map((d) => mkdir(path.join(root, d), { recursive: true })));
await Promise.all(files.map((f) => writeFile(path.join(root, f.path), f.content + "\n")));

const counts = files.reduce(
  (m, f) => m.set(f.path.split("/")[0], (m.get(f.path.split("/")[0]) ?? 0) + 1),
  new Map<string, number>(),
);
console.log(`匯出 ${files.length} 個檔到 ${root}`);
counts.forEach((n, k) => console.log(`  ${k}: ${n}`));
