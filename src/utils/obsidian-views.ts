// Obsidian 端的書牆與統計頁：書牆是 Bases 設定，統計是 Mermaid 圖，都不用外掛
import type { ExportEntry, ExportFile } from "@/utils/obsidian-export";

const DIR = "01 紀錄"; // 跟書籍同一層

// 目錄一律用嵌入查詢，不寫 [[連結]]——列出來不等於從屬，關聯圖會畫錯
const baseBlock = (yaml: string) => ["```base", yaml.trimEnd(), "```"];

const READING_VIEW = `filters:
  and:
    - status == "閱讀中"
views:
  - type: table
    name: 閱讀中
    order:
      - file.name
      - creator
      - started
      - platform
`;

const READ_LOG_VIEW = `filters:
  and:
    - source == "archivum"
    - last_read != null
views:
  - type: table
    name: 閱讀紀錄
    order:
      - file.name
      - type
      - started
      - finished
      - platform
      - reads
    sort:
      - property: last_read
        direction: DESC
`;

const countBy = <T>(items: T[], key: (t: T) => string | null) =>
  items.reduce((m, t) => {
    const k = key(t);
    return k ? m.set(k, (m.get(k) ?? 0) + 1) : m;
  }, new Map<string, number>());

const quote = (s: string) => `"${s.replace(/"/g, "'")}"`;

function barChart(title: string, counts: Map<string, number>, unit = "本"): string[] {
  if (!counts.size) return [];
  const keys = [...counts.keys()];
  return [
    "```mermaid",
    "xychart-beta",
    `  title ${quote(title)}`,
    `  x-axis [${keys.map(quote).join(", ")}]`,
    `  y-axis "${unit}"`,
    `  bar [${keys.map((k) => counts.get(k)).join(", ")}]`,
    "```",
    "",
  ];
}

function pieChart(title: string, counts: Map<string, number>, top = 8): string[] {
  const sorted = [...counts].sort((a, b) => b[1] - a[1]);
  const rest = sorted.slice(top).reduce((n, [, c]) => n + c, 0);
  const slices = [...sorted.slice(0, top), ...(rest ? [["其他", rest] as [string, number]] : [])];
  if (!slices.length) return [];
  return [
    "```mermaid",
    `pie title ${title}`,
    ...slices.map(([k, c]) => `  ${quote(k)} : ${c}`),
    "```",
    "",
  ];
}

/** 統計頁；today 從外面給，函式保持純 */
export function renderStats(entries: ExportEntry[], today: string): ExportFile {
  const books = entries.filter((e) => e.kind === "書籍");
  const reads = books.flatMap((b) => b.reads.map((r) => ({ ...r, book: b })));
  const finished = reads.filter((r) => r.end);
  const reading = books.filter((b) => b.reads.some((r) => r.start && !r.end));
  const year = today.slice(0, 4);
  const byYear = new Map([...countBy(finished, (r) => r.end!.slice(0, 4))].sort());
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
  const thisYear = countBy(
    finished.filter((r) => r.end!.startsWith(year)),
    (r) => `${Number(r.end!.slice(5, 7))}月`,
  );
  const byMonth = new Map(months.map((m) => [m, thisYear.get(m) ?? 0]));

  const content = [
    "---",
    "type: 統計",
    "source: archivum",
    "---",
    "",
    "> [!info] 自動產生，每次匯出 archivum 時更新",
    "",
    "# 閱讀統計",
    "",
    `- 書籍 **${books.length}** 本，讀完 **${finished.length}** 次`,
    `- ${year} 年讀完 **${thisYear.size ? [...thisYear.values()].reduce((a, b) => a + b, 0) : 0}** 本`,
    `- 閱讀中 **${reading.length}** 本`,
    "",
    ...(reading.length ? ["## 閱讀中", "", ...baseBlock(READING_VIEW), ""] : []),
    "## 每年讀完",
    "",
    ...barChart("每年讀完", byYear),
    `## ${year} 每月讀完`,
    "",
    ...barChart(`${year} 每月`, byMonth),
    "## 平台",
    "",
    ...pieChart(
      "平台",
      countBy(reads, (r) => r.platform || null),
    ),
    "## 領域",
    "",
    ...pieChart(
      "領域",
      countBy(books, (b) => (b.meta.topic as string) || null),
    ),
  ].join("\n");
  return { path: `${DIR}/閱讀統計.md`, content };
}

/** 書牆：Bases 卡片檢視，封面當圖 */
export const shelfBase: ExportFile = {
  path: `${DIR}/書牆.base`,
  content: `filters:
  and:
    - archivum_kind == "書籍"
views:
  - type: cards
    name: 書牆
    image: note.cover
    imageFit: contain
    imageAspectRatio: 1.45
    order:
      - file.name
      - creator
      - last_read
    sort:
      - property: last_read
        direction: DESC
  - type: cards
    name: 閱讀中
    filters:
      and:
        - status == "閱讀中"
    image: note.cover
    imageFit: contain
    imageAspectRatio: 1.45
    order:
      - file.name
      - creator
  - type: table
    name: 表格
    order:
      - file.name
      - creator
      - topic
      - last_read
      - status
    sort:
      - property: last_read
        direction: DESC
`,
};

/** 閱讀紀錄：嵌入 Bases 表格，一本一列；每次閱讀的細節在書的檔案裡 */
export function renderReadLog(): ExportFile {
  const content = [
    "---",
    "type: 統計",
    "source: archivum",
    "---",
    "",
    "> [!info] 自動產生，每次匯出 archivum 時更新；要記新的閱讀請到 archivum",
    "",
    "# 閱讀紀錄",
    "",
    ...baseBlock(READ_LOG_VIEW),
  ].join("\n");
  return { path: `${DIR}/閱讀紀錄.md`, content };
}

const GROUP_COLUMNS: Record<string, string[]> = {
  "01 紀錄": ["creator", "topic", "last_read", "status"],
  "02 片段": ["translation", "pronunciation", "topic", "created"],
  "03 書寫": ["finished", "topic", "created"],
};

/** 每個類型資料夾一個 Base：卡片（有圖就用）、表格（附筆數）、依領域分組 */
export function kindBase(folder: string, hasImage: boolean): ExportFile {
  const group = folder.split("/")[0];
  const kind = folder.split("/").pop()!;
  const columns = ["file.name", ...(GROUP_COLUMNS[group] ?? [])];
  const order = columns.map((c) => `      - ${c}`).join("\n");
  const image = hasImage ? "    image: note.cover\n    imageFit: cover\n" : "";
  const content = `filters:
  and:
    - file.inFolder("${folder}")
    - file.ext == "md"
views:
  - type: cards
    name: 卡片
${image}    order:
${order}
  - type: table
    name: 表格
    order:
${order}
    summaries:
      file.name: Count
  - type: table
    name: 依領域
    groupBy:
      property: topic
      direction: ASC
    order:
${order}
`;
  return { path: `${folder}/${kind}.base`, content };
}

const lastMonths = (today: string, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - (n - 1 - i));
    return d.toISOString().slice(0, 7);
  });

/** 片段或書寫的統計頁：各類型筆數、近 12 個月新增、領域分布 */
export function renderGroupStats(entries: ExportEntry[], group: string, today: string): ExportFile {
  const items = entries.filter((e) => e.folder.startsWith(`${group}/`));
  const label = group.split(" ").pop()!;
  const months = lastMonths(today, 12);
  const added = countBy(items, (e) => String(e.meta.created ?? "").slice(0, 7) || null);
  const byMonth = new Map(months.map((m) => [`${Number(m.slice(5))}月`, added.get(m) ?? 0]));
  const byKind = countBy(items, (e) => e.kind);
  const content = [
    "---",
    "type: 統計",
    "source: archivum",
    "---",
    "",
    "> [!info] 自動產生，每次匯出 archivum 時更新；只算 archivum 的資料",
    "",
    `# ${label}統計`,
    "",
    ...[...byKind].map(([k, n]) => `- ${k} **${n}** 則`),
    "",
    "## 近 12 個月新增",
    "",
    ...barChart("每月新增", byMonth, "則"),
    "## 類型",
    "",
    ...pieChart("類型", byKind),
    "## 領域",
    "",
    ...pieChart(
      "領域",
      countBy(items, (e) => (e.meta.topic as string) || null),
    ),
    ...[...byKind.keys()].flatMap((k) => {
      const langs = countBy(
        items.filter((e) => e.kind === k),
        (e) => (e.meta.language as string) || null,
      );
      return langs.size > 1 ? [`## ${k}的語言`, "", ...pieChart(`${k}的語言`, langs)] : [];
    }),
  ].join("\n");
  return { path: `${group}/${label}統計.md`, content };
}
