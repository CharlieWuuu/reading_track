// archivum → Obsidian 單向鏡像：資料列轉成 { path, content }，不碰檔案系統
// 只管標記之間那段與 frontmatter，標記外是使用者自己寫的，合併時保留

export type ExportRead = { start: string | null; end: string | null; platform: string };

export type ExportEntry = {
  id: string;
  kind: string; // 類型名稱
  folder: string; // vault 裡的資料夾，例如 01 紀錄/書籍
  title: string;
  body: string;
  meta: Record<string, string | number | boolean | null>; // 空值不寫進 frontmatter
  tags: string[];
  urls: string[];
  reads: ExportRead[]; // 只有作品有
};

export type ExportFile = { path: string; content: string };

export const MARK_START = "<!-- archivum:start -->";
export const MARK_END = "<!-- archivum:end -->";
const TITLE_MAX = 40; // 佳句的標題是整句話，檔名要截
const sanitize = (title: string) =>
  title
    .replace(/[\\/:*?"<>|#^[\]\n\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, TITLE_MAX) || "未命名";

/** id → 路徑（不含副檔名）；同資料夾撞名就補 id 前六碼 */
export function assignNames(entries: ExportEntry[]): Map<string, string> {
  const base = entries.map((e) => [e.id, `${e.folder}/${sanitize(e.title)}`] as const);
  const counts = base.reduce(
    (m, [, n]) => m.set(n, (m.get(n) ?? 0) + 1),
    new Map<string, number>(),
  );
  return new Map(base.map(([id, n]) => [id, counts.get(n)! > 1 ? `${n} (${id.slice(0, 6)})` : n]));
}

/** 內文開頭一小段，給 Bases 的表格與卡片顯示（Bases 讀不到內文） */
export const excerpt = (body: string, max = 60): string => {
  const flat = body
    .replace(/[#>*_`[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return flat.length > max ? `${[...flat].slice(0, max).join("")}…` : flat;
};

export type MentionTerm = {
  surface: string; // 文中出現的寫法
  target: string; // 連到哪個檔
  notFollowedBy?: string; // 例：羅馬後面接「字」就不是那座城
};

const PROTECTED =
  /```[\s\S]*?```|`[^`\n]*`|\[\[[\s\S]*?\]\]|\[[^\]]*\]\([^)]*\)|https?:\/\/\S+|^#[^\n]*/gm;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 每個詞只連第一次出現；程式碼、既有連結、網址、標題不動；長的詞先比對 */
export function linkMentions(text: string, terms: MentionTerm[]): string {
  const sorted = [...terms].sort((a, b) => b.surface.length - a.surface.length);
  return sorted.reduce((body, t) => {
    if (body.includes(`[[${t.target}]]`) || body.includes(`[[${t.target}|`)) return body;
    const ascii = /^[\w .+#-]+$/.test(t.surface);
    const re = new RegExp(
      (ascii ? "(?<![A-Za-z0-9])" : "") +
        escapeRe(t.surface) +
        (ascii ? "(?![A-Za-z0-9])" : "") +
        (t.notFollowedBy ? `(?!${t.notFollowedBy})` : ""),
    );
    const parts = body.split(PROTECTED);
    const kept = body.match(PROTECTED) ?? [];
    const i = parts.findIndex((p) => re.test(p));
    if (i < 0) return body;
    const link = t.surface === t.target ? `[[${t.target}]]` : `[[${t.target}|${t.surface}]]`;
    parts[i] = parts[i].replace(re, link);
    return parts.flatMap((p, j) => (j < kept.length ? [p, kept[j]] : [p])).join("");
  }, text);
}

/** 站內連結不分方向，攤成 id → 相關 id 清單 */
export function linkIndex(links: [string, string][]): Map<string, string[]> {
  return links.reduce((m, [a, b]) => {
    m.set(a, [...(m.get(a) ?? []), b]);
    m.set(b, [...(m.get(b) ?? []), a]);
    return m;
  }, new Map<string, string[]>());
}

const yamlValue = (v: string | number | boolean) =>
  typeof v === "string" ? JSON.stringify(v) : String(v); // JSON 字串剛好是合法的 YAML

function frontmatter(e: ExportEntry): string {
  const meta = Object.entries(e.meta).filter(([, v]) => v !== null && v !== "") as [
    string,
    string | number | boolean,
  ][];
  const lines = [
    `archivum_id: ${e.id}`,
    `archivum_kind: ${yamlValue(e.kind)}`,
    ...meta.map(([k, v]) => `${k}: ${yamlValue(v)}`),
    ...(e.tags.length ? [`tags: [${e.tags.map(yamlValue).join(", ")}]`] : []),
  ];
  return `---\n${lines.join("\n")}\n---`;
}

const readLine = (r: ExportRead) =>
  `- ${r.start ?? "?"} → ${r.end ?? "閱讀中"}${r.platform ? `（${r.platform}）` : ""}`;

function section(heading: string, lines: string[]): string[] {
  return lines.length ? [`## ${heading}`, "", ...lines, ""] : [];
}

export function renderEntry(
  e: ExportEntry,
  names: Map<string, string>,
  related: ExportEntry[],
  taken: Set<string> = new Set(), // vault 裡使用者自己的檔名，同名時連結要帶路徑
  mentions: MentionTerm[] = [],
): string {
  const basenames = [...names.values()].map((n) => n.split("/").pop()!);
  const wiki = (r: ExportEntry) => {
    const name = names.get(r.id)!;
    const short = name.split("/").pop()!;
    const ambiguous = basenames.filter((b) => b === short).length > 1 || taken.has(short);
    const target = ambiguous ? name : short; // 札記跟書同名時帶路徑
    const label = r.title.replace(/[|\]\n]/g, " ").trim();
    return short === label ? `[[${target}]]` : `[[${target}|${label}]]`;
  };
  const byKind = related.reduce(
    (m, r) => m.set(r.kind, [...(m.get(r.kind) ?? []), r]),
    new Map<string, ExportEntry[]>(),
  );
  return [
    frontmatter(e),
    "",
    MARK_START, // 標記是 HTML 註解，閱讀時看不到；說明寫在 vault 的 README
    `# ${e.title || "未命名"}`,
    "",
    ...(e.meta.creator ? [linkMentions(`作者：${e.meta.creator}`, mentions), ""] : []), // 作者是關鍵字就連過去
    ...(e.body.trim()
      ? [
          linkMentions(
            e.body.trim(),
            mentions.filter((m) => m.target !== names.get(e.id)!.split("/").pop()),
          ),
          "",
        ]
      : []),
    ...section("閱讀紀錄", e.reads.map(readLine)),
    ...[...byKind].flatMap(([kind, rs]) =>
      section(
        kind,
        rs.map((r) => `- ${wiki(r)}${r.meta.locator ? `（${r.meta.locator}）` : ""}`), // 一本書多篇心得，靠段落分辨
      ),
    ),
    ...section(
      "連結",
      e.urls.map((u) => `- ${u}`),
    ),
    MARK_END,
  ].join("\n");
}

/** 整批轉檔；路徑相對於匯出根目錄 */
export function buildFiles(
  entries: ExportEntry[],
  links: [string, string][],
  taken: Set<string> = new Set(),
  mentions: MentionTerm[] = [],
): ExportFile[] {
  const names = assignNames(entries);
  const byId = new Map(entries.map((e) => [e.id, e]));
  const index = linkIndex(links);
  return entries.map((e) => {
    const related = [...new Set(index.get(e.id) ?? [])]
      .map((id) => byId.get(id))
      .filter((r): r is ExportEntry => r !== undefined); // 另一端是私密或已刪就略過
    return {
      path: `${names.get(e.id)}.md`,
      content: renderEntry(e, names, related, taken, mentions),
    };
  });
}

const splitFrontmatter = (text: string): [string[], string] => {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  return m ? [m[1].split("\n"), text.slice(m[0].length)] : [[], text];
};
const keyOf = (line: string) => line.match(/^([^\s:][^:]*):/)?.[1] ?? null;
const tagsOf = (lines: string[]) =>
  (lines.find((l) => keyOf(l) === "tags")?.match(/\[(.*)\]/)?.[1] ?? "")
    .split(",")
    .map((t) => t.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);

/**
 * 把新產生的內容併進既有檔案。frontmatter：archivum 有的鍵覆蓋、其他保留、tags 取聯集；
 * 內文：替換標記之間那段，沒有標記（使用者原本的筆記）就把整段放到最上面
 */
export function mergeManaged(existing: string | null, generated: string): string {
  if (existing === null) return generated;
  const [genFm, genBody] = splitFrontmatter(generated);
  const [oldFm, oldBody] = splitFrontmatter(existing);
  const genKeys = new Set(genFm.map(keyOf));
  const tags = [...new Set([...tagsOf(genFm), ...tagsOf(oldFm)])];
  const fm = [
    ...genFm.filter((l) => keyOf(l) !== "tags"),
    ...oldFm.filter((l) => !genKeys.has(keyOf(l)) && keyOf(l) !== "tags"),
    ...(tags.length ? [`tags: [${tags.map(yamlValue).join(", ")}]`] : []),
  ];
  const start = oldBody.indexOf(MARK_START);
  const end = oldBody.indexOf(MARK_END);
  const block = genBody.trim();
  const body =
    start >= 0 && end > start
      ? oldBody.slice(0, start) + block + oldBody.slice(end + MARK_END.length)
      : `${block}\n\n${oldBody.trim()}\n`;
  return `---\n${fm.join("\n")}\n---\n\n${body.trim()}\n`;
}

/** 標記以外有沒有使用者自己寫的東西；archivum 刪掉的資料只有沒補充時才刪檔 */
export function hasOwnContent(text: string): boolean {
  const [, body] = splitFrontmatter(text);
  const start = body.indexOf(MARK_START);
  const end = body.indexOf(MARK_END);
  const outside =
    start >= 0 && end > start ? body.slice(0, start) + body.slice(end + MARK_END.length) : body;
  return outside.trim().length > 0;
}
