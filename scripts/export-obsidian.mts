import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import {
  assignNames,
  buildFiles,
  hasOwnContent,
  mergeManaged,
  type ExportEntry,
} from "../src/utils/obsidian-export";
import { renderReadLog, renderStats, shelfBase } from "../src/utils/obsidian-views";

/**
 * 把一個帳號的作品、片段、書寫匯出進 Obsidian vault。單向：archivum 是正本。
 *
 * 依 group 放進 vault 的三層（01 紀錄／02 片段／03 書寫）＋類型資料夾，跟使用者的筆記混放。
 * 檔案靠 frontmatter 的 archivum_id 認，改名就搬檔；只改標記之間那段，標記外是使用者的補充。
 * archivum 刪掉的資料：沒補充才刪檔，有補充就留著並印出來。
 *
 * 只讀不寫：整段包在 read only 交易裡。私密的也匯出，frontmatter 標 private: true——
 * vault 只有本人看得到，私密密碼是給 archivum 畫面用的。
 *
 * 用法：
 *   npx tsx --env-file=.env.prod scripts/export-obsidian.mts <email> <vault 根目錄> [--limit-books=5]
 */

const [email, outDir] = process.argv.slice(2);
const limitArg = process.argv.find((a) => a.startsWith("--limit-books="));
const LIMIT_BOOKS = limitArg ? Number(limitArg.split("=")[1]) : null; // 試做用：只匯最新幾本與連到它們的資料
if (!email || !outDir) throw new Error("用法：export-obsidian.mts <email> <vault 根目錄>");

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
    select w.id, k.name kind, k.group_key grp, w.title, w.body, w.creator, w.publisher, w.language, w.amount,
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
    select f.id, f.is_private, k.name kind, k.group_key grp, f.title, f.body, f.locator, f.pronunciation, f.translation, f.creator,
           f.start_year, f.end_year, f.latitude, f.longitude, f.tags, f.created_at::date::text created,
           tp.name topic
    from domain_fragments f
    join setting_kinds k on k.id = f.kind_id
    left join domain_record_topic tp on tp.id = f.topic_id
    where f.user_id = ${uid}`;
  const writings = await t`
    select wr.id, wr.is_private, k.name kind, k.group_key grp, wr.title, wr.body, wr.end_date::text e, wr.locator, wr.tags,
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
const GROUP_DIR: Record<string, string> = {
  records: "01 紀錄",
  fragments: "02 片段",
  writings: "03 書寫",
};
const placed = (row: postgres.Row) => ({
  kind: row.kind,
  folder: `${GROUP_DIR[row.grp] ?? "00 收件匣"}/${row.kind}`,
});
const vaultMeta = (kind: string) => ({ type: kind, source: "archivum" }); // 跟 vault 自己的筆記同一組欄位
// 封面在私有 bucket，簽名網址會過期，所以下載進 vault；外部網址照用
const COVER_DIR = "01 紀錄/封面";
const coverFile = (key: string) => key.split("/").pop()!;
const coverRef = (key: string) =>
  !key ? null : /^https?:/.test(key) ? key : `[[${coverFile(key)}]]`;
const lastRead = (reads: ExportEntry["reads"]) =>
  reads
    .map((r) => r.end ?? r.start ?? "")
    .sort()
    .at(-1) || null;
/** 最近一次閱讀攤成 frontmatter，閱讀紀錄的 Bases 表格才排得出來；每次的細節在內文 */
const latestRead = (reads: ExportEntry["reads"]) => {
  const last = reads.at(-1); // 已依開始日排序
  return {
    started: last?.start ?? null,
    finished: last?.end ?? null,
    platform: last?.platform ?? null,
    reads: reads.length || null,
  };
};
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
  ...placed(w),
  title: w.title,
  body: w.body,
  meta: {
    ...vaultMeta(w.kind),
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
    ...latestRead(readsOf.get(w.id) ?? []),
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
  ...placed(f),
  title: f.title,
  body: f.body,
  meta: {
    ...vaultMeta(f.kind),
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
  ...placed(w),
  title: w.title,
  body: w.body,
  meta: {
    ...vaultMeta(w.kind),
    locator: w.locator,
    finished: w.e,
    topic: w.topic,
    created: w.created,
    private: w.is_private || null,
  },
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
const root = path.resolve(outDir);

// 掃 vault：archivum_id → 現在的路徑；其他檔名留著判斷連結要不要帶路徑
const walk = async (dir: string): Promise<string[]> =>
  (await readdir(dir, { withFileTypes: true }))
    .filter((d) => !d.name.startsWith("."))
    .reduce<Promise<string[]>>(async (acc, d) => {
      const full = path.join(dir, d.name);
      if (d.isDirectory()) return [...(await acc), ...(await walk(full))];
      return d.name.endsWith(".md") ? [...(await acc), full] : acc;
    }, Promise.resolve([]));
const vaultFiles = await Promise.all(
  (await walk(root)).map(async (p) => ({ path: p, text: await readFile(p, "utf8") })),
);
const idOf = (text: string) => text.match(/^archivum_id: (\S+)$/m)?.[1] ?? null;
const ownedPath = new Map(
  vaultFiles.flatMap((f) => (idOf(f.text) ? [[idOf(f.text)!, f.path] as const] : [])),
);
const names = assignNames(entries);
const exportedPaths = new Set([...names.values()].map((n) => path.join(root, `${n}.md`)));
const taken = new Set(
  vaultFiles
    .filter((f) => !idOf(f.text) && !exportedPaths.has(f.path)) // 同路徑的使用者筆記會被併進來，不算撞名
    .map((f) => path.basename(f.path, ".md")),
);

const files = buildFiles(entries, links, taken);
const generated = [
  renderStats(entries, new Date().toISOString().slice(0, 10)),
  renderReadLog(),
  shelfBase,
];

const textAt = new Map(vaultFiles.map((f) => [f.path, f.text]));
const stats = { created: 0, updated: 0, moved: 0, merged: 0 };
for (const f of files) {
  const target = path.join(root, f.path);
  const id = idOf(f.content)!;
  const from = ownedPath.get(id);
  await mkdir(path.dirname(target), { recursive: true });
  if (from && from !== target) {
    await rename(from, target); // archivum 改了標題或類型
    textAt.set(target, textAt.get(from)!);
    stats.moved++;
  }
  const old = textAt.get(target) ?? null;
  if (old === null) stats.created++;
  else if (!idOf(old))
    stats.merged++; // 使用者原本同名的筆記
  else stats.updated++;
  await writeFile(target, mergeManaged(old, f.content));
}
await Promise.all(generated.map((g) => writeFile(path.join(root, g.path), g.content + "\n")));

// archivum 已刪的：試做模式不刪，避免把沒匯到的當成刪除
const alive = new Set(entries.map((e) => e.id));
const gone = LIMIT_BOOKS ? [] : [...ownedPath].filter(([id]) => !alive.has(id));
const kept = (
  await Promise.all(
    gone.map(async ([, p]) => {
      if (hasOwnContent(textAt.get(p)!)) return p;
      await rm(p);
      return null;
    }),
  )
).filter(Boolean);

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

console.log(
  `新增 ${stats.created}、更新 ${stats.updated}、搬移 ${stats.moved}、併入既有筆記 ${stats.merged}、刪除 ${gone.length - kept.length}`,
);
kept.forEach((p) => console.log(`  archivum 已刪但有補充，留著：${path.relative(root, p!)}`));
