// Obsidian 端的書牆與統計頁：書牆是 Bases 設定，統計是 Mermaid 圖，都不用外掛
import type { ExportEntry, ExportFile } from "@/utils/obsidian-export";

const DIR = "01 紀錄"; // 跟書籍同一層

/** 產生的總表一律帶路徑連結，不怕跟使用者的檔案同名 */
const fullLink = (e: ExportEntry, names: Map<string, string>) =>
  `[[${names.get(e.id)}|${e.title.replace(/[|\]\n]/g, " ").trim()}]]`;

const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86400000) + 1;

const countBy = <T>(items: T[], key: (t: T) => string | null) =>
  items.reduce((m, t) => {
    const k = key(t);
    return k ? m.set(k, (m.get(k) ?? 0) + 1) : m;
  }, new Map<string, number>());

const quote = (s: string) => `"${s.replace(/"/g, "'")}"`;

function barChart(title: string, counts: Map<string, number>): string[] {
  if (!counts.size) return [];
  const keys = [...counts.keys()];
  return [
    "```mermaid",
    "xychart-beta",
    `  title ${quote(title)}`,
    `  x-axis [${keys.map(quote).join(", ")}]`,
    `  y-axis "本"`,
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
export function renderStats(
  entries: ExportEntry[],
  names: Map<string, string>,
  today: string,
): ExportFile {
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
  const link = (b: ExportEntry) => fullLink(b, names);

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
    ...(reading.length ? ["## 閱讀中", "", ...reading.map((b) => `- ${link(b)}`), ""] : []),
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

/** 閱讀紀錄總表：一次閱讀一列，新的在上 */
export function renderReadLog(entries: ExportEntry[], names: Map<string, string>): ExportFile {
  const rows = entries
    .filter((e) => e.reads.length)
    .flatMap((e) => e.reads.map((r) => ({ ...r, entry: e })))
    .sort((a, b) => (b.end ?? b.start ?? "9999").localeCompare(a.end ?? a.start ?? "9999"));
  const cell = (s: string) => s.replace(/\|/g, "\\|");
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
    "| 開始 | 讀完 | 作品 | 類型 | 平台 | 天數 |",
    "|---|---|---|---|---|---|",
    ...rows
      .map((r) =>
        [
          r.start ?? "",
          r.end ?? "閱讀中",
          cell(fullLink(r.entry, names)), // 表格裡別名的 | 要跳脫
          r.entry.kind,
          r.platform,
          r.start && r.end ? String(daysBetween(r.start, r.end)) : "",
        ].join(" | "),
      )
      .map((l) => `| ${l} |`),
  ].join("\n");
  return { path: `${DIR}/閱讀紀錄.md`, content };
}
