import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import {
  assignNames,
  buildFiles,
  excerpt,
  hasOwnContent,
  mergeManaged,
  type ExportEntry,
} from "../src/utils/obsidian-export";
import { kindBase, renderKindStats, renderStats } from "../src/utils/obsidian-views";

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
           w.translation, w.start_year, w.end_year, w.tags, w.cover_url, tp.name topic, coalesce(tpp.name, tp.name) domain, a.name attribute
    from domain_works w
    join setting_kinds k on k.id = w.kind_id
    left join domain_record_topic tp on tp.id = w.topic_id
    left join domain_record_topic tpp on tpp.id = tp.parent_id
    left join domain_attribute a on a.id = w.attribute_id
    where w.user_id = ${uid}`;
  const records = await t`
    select r.id, r.work_id, r.is_private, r.start_date::text s, r.end_date::text e, p.name platform
    from domain_records r left join domain_platform p on p.id = r.platform_id
    where r.user_id = ${uid}
    order by r.start_date nulls last`;
  const fragments = await t`
    select f.id, f.is_private, f.cover_url, k.name kind, k.group_key grp, f.title, f.body, f.locator, f.pronunciation, f.translation, f.creator,
           f.start_year, f.end_year, f.language, f.latitude, f.longitude, f.tags, f.created_at::date::text created,
           tp.name topic, coalesce(tpp.name, tp.name) domain
    from domain_fragments f
    join setting_kinds k on k.id = f.kind_id
    left join domain_record_topic tp on tp.id = f.topic_id
    left join domain_record_topic tpp on tpp.id = tp.parent_id
    where f.user_id = ${uid}`;
  const writings = await t`
    select wr.id, wr.is_private, k.name kind, k.group_key grp, wr.title, wr.body, wr.end_date::text e, wr.locator, wr.tags,
           wr.created_at::date::text created, tp.name topic, coalesce(tpp.name, tp.name) domain
    from domain_writings wr
    join setting_kinds k on k.id = wr.kind_id
    left join domain_record_topic tp on tp.id = wr.topic_id
    left join domain_record_topic tpp on tpp.id = tp.parent_id
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
// 頁面本身放在 99 資料；層資料夾（01 紀錄…）只放 base 與統計頁，給人瀏覽
const DATA_DIR = "99 資料";
const GROUP_DIR: Record<string, string> = {
  records: "01 紀錄",
  fragments: "02 片段",
  writings: "03 書寫",
};
const placed = (row: postgres.Row) => ({
  kind: row.kind,
  folder: GROUP_DIR[row.grp]
    ? `${DATA_DIR}/${GROUP_DIR[row.grp]}/${row.kind}`
    : `00 收件匣/${row.kind}`,
});
const vaultMeta = (kind: string) => ({ type: kind, source: "archivum" }); // 跟 vault 自己的筆記同一組欄位
// 封面在私有 bucket，簽名網址會過期，所以下載進 vault；外部網址照用
const coverFile = (key: string) => key.split("/").pop()!;
// archivum 的代理網址（/api/cover?src=…）：原圖擋盜連（國會圖書館驗 Referer），下載進 vault
const proxied = (key: string) => {
  const src = key.match(/cover\?src=([^&]+)/)?.[1];
  return src ? decodeURIComponent(src) : undefined;
};
const proxyFile = (src: string) => `proxy-${src.split("/").pop()}`;
const isStorageKey = (key: string) => !!key && !/^https?:/.test(key) && !proxied(key);
const coverRef = (key: string) => {
  const src = proxied(key);
  if (src) return `[[${proxyFile(src)}]]`;
  return !key ? null : /^https?:/.test(key) ? key : `[[${coverFile(key)}]]`;
};
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
    domain: w.domain,
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
// 關鍵字的圖：維基條目的代表圖，網址直接用（Wikimedia 的縮圖網址穩定），查過的記在快取
const WIKI_CACHE = "node_modules/.cache/obsidian-wiki-thumbs.json";
const wikiCache: Record<string, string | null> = await readFile(WIKI_CACHE, "utf8")
  .then(JSON.parse)
  .catch(() => ({}));
const wikiUrlOf = (id: string) =>
  (urlsOf.get(id) ?? [])
    .map((u: string) => u.match(/https?:\/\/([a-z-]+)\.wikipedia\.org\/wiki\/([^)\s#?]+)/))
    .find(Boolean);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const thumbOf = async (lang: string, title: string, attempt = 0): Promise<string | null> => {
  const key = `${lang}:${title}`;
  if (key in wikiCache) return wikiCache[key];
  await sleep(300); // 維基會限速，太快會回 429
  const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${title}`, {
    headers: { "User-Agent": "archivum-obsidian-export (personal use)" },
  }).catch(() => null);
  if (res?.status === 429 && attempt < 3) {
    await sleep(5000 * (attempt + 1));
    return thumbOf(lang, title, attempt + 1);
  }
  if (!res || (!res.ok && res.status !== 404)) return null; // 暫時失敗不進快取，下次再查
  const json = res.ok ? await res.json() : null;
  wikiCache[key] = json?.thumbnail?.source ?? null;
  return wikiCache[key];
};
const wikiThumbs = new Map<string, string>();
for (const f of data.fragments) {
  const m = wikiUrlOf(f.id);
  const thumb = m ? await thumbOf(m[1], m[2]) : null; // 一筆一筆查，不對維基開大量併發
  if (thumb) wikiThumbs.set(f.id, thumb);
}

// 沒有維基條目圖的關鍵字：先找 Wikimedia Commons，再找 Openverse（都只收自由授權的圖）
const searchCached = async <T,>(
  key: string,
  url: string,
  pick: (json: T) => string | undefined,
) => {
  if (key in wikiCache) return wikiCache[key];
  await sleep(300);
  const res = await fetch(url, {
    headers: { "User-Agent": "archivum-obsidian-export (personal use)" },
  }).catch(() => null);
  if (!res?.ok) return null; // 暫時失敗不進快取
  wikiCache[key] = pick((await res.json()) as T) ?? null;
  return wikiCache[key];
};
const commonsOf = (q: string) =>
  searchCached<{ query?: { pages?: Record<string, { imageinfo?: { thumburl?: string }[] }> } }>(
    `commons:${q}`,
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=640&gsrsearch=${encodeURIComponent(`${q} filetype:bitmap`)}`,
    (j) => Object.values(j?.query?.pages ?? {})[0]?.imageinfo?.[0]?.thumburl,
  );
const openverseOf = (q: string) =>
  searchCached<{ results?: { thumbnail?: string }[] }>(
    `openverse:${q}`,
    `https://api.openverse.org/v1/images/?page_size=1&q=${encodeURIComponent(q)}`,
    (j) => j?.results?.[0]?.thumbnail,
  );
for (const f of data.fragments) {
  if (f.kind !== "關鍵字" || f.cover_url || wikiThumbs.has(f.id)) continue;
  const q = f.title.split(/[：:（(]/)[0].trim(); // 「紐約：從荷蘭小鎮…」只拿「紐約」去查
  const thumb = q ? ((await commonsOf(q)) ?? (await openverseOf(q))) : null;
  if (thumb) wikiThumbs.set(f.id, thumb);
}
await mkdir(path.dirname(WIKI_CACHE), { recursive: true });
await writeFile(WIKI_CACHE, JSON.stringify(wikiCache));

const fragments: ExportEntry[] = data.fragments.map((f) => ({
  ...base,
  id: f.id,
  ...placed(f),
  title: f.title,
  body: f.body,
  meta: {
    ...vaultMeta(f.kind),
    cover: coverRef(f.cover_url ?? "") ?? wikiThumbs.get(f.id) ?? null,
    language: f.language,
    locator: f.locator,
    pronunciation: f.pronunciation,
    translation: f.translation,
    creator: f.creator,
    start_year: f.start_year,
    end_year: f.end_year,
    latitude: f.latitude,
    longitude: f.longitude,
    coordinates: f.latitude != null && f.longitude != null ? `${f.latitude}, ${f.longitude}` : null, // Maps 外掛讀這欄
    topic: f.topic,
    domain: f.domain,
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
    domain: w.domain,
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

const withSummary = (e: ExportEntry): ExportEntry => ({
  ...e,
  meta: { ...e.meta, summary: excerpt(e.body) || null },
});
const entries = (
  LIMIT_BOOKS ? latestBooks(LIMIT_BOOKS) : [...works, ...fragments, ...writings]
).map(withSummary);
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

// 內文提到關鍵字就連：archivum 的關鍵字＋使用者自己寫在關鍵字資料夾的
const KEYWORD_DIR = `${DATA_DIR}/02 片段/關鍵字`;
const TOO_COMMON = new Set(["歷史"]);
const surfacesOf = (title: string) => {
  const bare = title.replace(/（.*?）/g, "").trim();
  const bilingual = title.match(/^(.*[\u4e00-\u9fff].*?) ([A-Za-z].+)$/); // 中英雙名才拆
  return [...new Set([title, bare, ...(bilingual ? [bilingual[1], bilingual[2]] : [])])].filter(
    (f) => f.length >= 2 && !TOO_COMMON.has(f),
  );
};
const keywordTargets = [
  ...entries
    .filter((e) => e.folder === KEYWORD_DIR && !/ \([0-9a-f]{6}\)$/.test(names.get(e.id)!))
    .map((e) => names.get(e.id)!.split("/").pop()!),
  ...vaultFiles
    .filter((f) => !idOf(f.text) && path.dirname(path.relative(root, f.path)) === KEYWORD_DIR)
    .map((f) => path.basename(f.path, ".md")),
];
const mentions = keywordTargets.flatMap((target) =>
  surfacesOf(target).map((surface) => ({
    surface,
    target,
    notFollowedBy: surface === "羅馬" ? "字|拼音|帝國|化" : undefined,
  })),
);
// 求職日記提到公司就連到找工作的筆記；內文寫《書名》就連到那本書
const companyMentions = vaultFiles
  .filter(
    (f) =>
      !idOf(f.text) &&
      path.dirname(path.relative(root, f.path)) === `${DATA_DIR}/03 書寫/思緒` &&
      /^tags:.*找工作/m.test(f.text),
  )
  .map((f) => path.basename(f.path, ".md"))
  .flatMap((target) => {
    const core = target
      .replace(/^\d+-/, "")
      .replace(/（.*?）/g, "")
      .trim();
    return core.length >= 2 ? [{ surface: core, target }] : [];
  });
const bookMentions = entries
  .filter((e) => e.kind === "書籍")
  .map((e) => ({ surface: `《${e.title}》`, target: names.get(e.id)!.split("/").pop()! }));
const files = buildFiles(entries, links, taken, [...mentions, ...companyMentions, ...bookMentions]);
// 每個資料夾一頁統計：archivum 的類型加上使用者自己的（思緒、工作名詞、素材…）
const dataFolders = new Set([
  ...vaultFiles
    .map((f) => path.relative(root, f.path))
    .filter((rel) => rel.startsWith(`${DATA_DIR}/`) && rel.split("/").length === 4)
    .map((rel) => path.dirname(rel)),
  ...entries.map((e) => e.folder).filter((f) => f.startsWith(`${DATA_DIR}/`)),
]);
const generated = [
  renderStats(),
  ...[...new Set(entries.map((e) => e.folder))].map((folder) => kindBase(folder)),
  ...[...dataFolders].map((folder) => renderKindStats(folder)),
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
  const next = mergeManaged(old, f.content);
  if (next === old) continue; // 內容沒變就不寫：保留修改時間，卡片才能照「最近編輯」排
  if (old === null) stats.created++;
  else if (!idOf(old))
    stats.merged++; // 使用者原本同名的筆記
  else stats.updated++;
  await writeFile(target, next);
}
await Promise.all(
  generated.map(async (g) => {
    const target = path.join(root, g.path);
    const next = `${g.content}\n`;
    if ((await readFile(target, "utf8").catch(() => null)) !== next) await writeFile(target, next);
  }),
);

// 使用者自己的筆記：summary 跟著內文更新（Bases 讀不到內文，卡片靠它顯示摘要）
let summaries = 0;
for (const f of vaultFiles) {
  const rel = path.relative(root, f.path);
  if (!rel.startsWith(`${DATA_DIR}/`) || idOf(f.text)) continue;
  const m = f.text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) continue;
  const body = f.text
    .slice(m[0].length)
    .replace(/```[\s\S]*?```|%%[\s\S]*?%%|!\[\[[^\]]*\]\]/g, "")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/^#+ .*$/gm, "");
  // 只取第一段：第一段寫大意（例如工作名詞的定義），後面的情境、細節不上卡片
  const summary = excerpt(body.trim().split(/\n\s*\n/)[0] ?? "");
  if (!summary) continue;
  const line = `summary: ${JSON.stringify(summary)}`;
  const fm = /^summary: .*$/m.test(m[1])
    ? m[1].replace(/^summary: .*$/m, line)
    : `${m[1]}\n${line}`;
  if (fm === m[1]) continue;
  await writeFile(f.path, `---\n${fm}\n---\n${f.text.slice(m[0].length)}`);
  summaries++;
}

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

// 封面跟著資料放在類型資料夾底下的「封面」（archivum 也是跟資料存在一起）；只補缺的
const COVER_SUBDIR = "封面";
type Cover = { file: string; dir: string; fetch: () => Promise<Buffer | null> };
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket =
  supabaseUrl && serviceKey
    ? createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      }).storage.from("images")
    : null;
const fromStorage = (key: string) => async () => {
  const { data: blob } = (await bucket?.download(key)) ?? {};
  return blob ? Buffer.from(await blob.arrayBuffer()) : null;
};
const fromReferer = (src: string) => async () => {
  const res = await fetch(src, { headers: { Referer: `${new URL(src).origin}/` } }).catch(
    () => null,
  );
  return res?.ok ? Buffer.from(await res.arrayBuffer()) : null;
};
const covers: Cover[] = [...data.works, ...data.fragments].flatMap((w) => {
  const key = (w.cover_url as string) ?? "";
  const dir = `${placed(w).folder}/${COVER_SUBDIR}`;
  const src = proxied(key);
  if (src) return [{ file: proxyFile(src), dir, fetch: fromReferer(src) }];
  return isStorageKey(key) ? [{ file: coverFile(key), dir, fetch: fromStorage(key) }] : [];
});
const parentOf = (dir: string) => path.join(root, path.dirname(dir)); // 上一版直接放在類型資料夾
const coverStats = { downloaded: 0, moved: 0, failed: 0 };
for (const c of covers) {
  const target = path.join(root, c.dir, c.file);
  if (
    await readFile(target).then(
      () => true,
      () => false,
    )
  )
    continue;
  await mkdir(path.dirname(target), { recursive: true });
  const old = path.join(parentOf(c.dir), c.file);
  if (
    await readFile(old).then(
      () => true,
      () => false,
    )
  ) {
    await rename(old, target);
    coverStats.moved++;
    continue;
  }
  const buf = await c.fetch();
  if (buf) {
    await writeFile(target, buf);
    coverStats.downloaded++;
  } else coverStats.failed++;
}
console.log(
  `自己的筆記更新摘要 ${summaries} 篇`,
  `封面：搬移 ${coverStats.moved}、新下載 ${coverStats.downloaded}、失敗 ${coverStats.failed}`,
);

console.log(
  `新增 ${stats.created}、更新 ${stats.updated}、搬移 ${stats.moved}、併入既有筆記 ${stats.merged}、刪除 ${gone.length - kept.length}`,
);
kept.forEach((p) => console.log(`  archivum 已刪但有補充，留著：${path.relative(root, p!)}`));
