// archivum → Obsidian 單向鏡像：資料列轉成 { path, content }，不碰檔案系統

export type ExportRead = { start: string | null; end: string | null; platform: string };

export type ExportEntry = {
  id: string;
  kind: string; // 類型名稱，也是資料夾名
  title: string;
  body: string;
  meta: Record<string, string | number | boolean | null>; // 空值不寫進 frontmatter
  tags: string[];
  urls: string[];
  reads: ExportRead[]; // 只有作品有
};

export type ExportFile = { path: string; content: string };

const NOTICE = "> [!info] 自動產生，請到 archivum 修改；這裡的改動下次匯出會被覆蓋";
const TITLE_MAX = 40; // 佳句的標題是整句話，檔名要截

const sanitize = (title: string) =>
  title
    .replace(/[\\/:*?"<>|#^[\]\n\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, TITLE_MAX) || "未命名";

/** id → 檔名（不含副檔名）；同類型撞名就補 id 前六碼 */
export function assignNames(entries: ExportEntry[]): Map<string, string> {
  const base = entries.map((e) => [e.id, `${e.kind}/${sanitize(e.title)}`] as const);
  const counts = base.reduce(
    (m, [, n]) => m.set(n, (m.get(n) ?? 0) + 1),
    new Map<string, number>(),
  );
  return new Map(base.map(([id, n]) => [id, counts.get(n)! > 1 ? `${n} (${id.slice(0, 6)})` : n]));
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
): string {
  const basenames = [...names.values()].map((n) => n.split("/").pop()!);
  const wiki = (r: ExportEntry) => {
    const name = names.get(r.id)!;
    const short = name.split("/").pop()!;
    const target = basenames.filter((b) => b === short).length > 1 ? name : short; // 札記跟書同名時帶資料夾
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
    NOTICE,
    "",
    `# ${e.title || "未命名"}`,
    "",
    ...(e.body.trim() ? [e.body.trim(), ""] : []),
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
  ].join("\n");
}

/** 整批轉檔；路徑相對於匯出根目錄 */
export function buildFiles(entries: ExportEntry[], links: [string, string][]): ExportFile[] {
  const names = assignNames(entries);
  const byId = new Map(entries.map((e) => [e.id, e]));
  const index = linkIndex(links);
  return entries.map((e) => {
    const related = [...new Set(index.get(e.id) ?? [])]
      .map((id) => byId.get(id))
      .filter((r): r is ExportEntry => r !== undefined); // 另一端是私密或已刪就略過
    return { path: `${names.get(e.id)}.md`, content: renderEntry(e, names, related) };
  });
}
