// Obsidian 端的書牆與統計頁：書牆是 Bases 設定，統計是 Mermaid 圖，都不用外掛
import type { ExportEntry, ExportFile } from "@/utils/obsidian-export";

const DIR = "01 紀錄"; // 跟書籍同一層

// 目錄一律用嵌入查詢，不寫 [[連結]]——列出來不等於從屬，關聯圖會畫錯
const baseBlock = (yaml: string) => ["```base", yaml.trimEnd(), "```"];

const READING_VIEW = `filters:
  and:
    - status == "閱讀中"
    - archivum_kind == "書籍"
views:
  - type: cards
    name: 閱讀中
    cardSize: 120
    image: note.cover
    imageFit: contain
    imageAspectRatio: 1.45
    order:
      - file.name
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

const GROUP_COLUMNS: Record<string, string[]> = {
  "01 紀錄": ["creator", "topic", "last_read", "status"],
  "02 片段": ["translation", "pronunciation", "topic", "created"],
  "03 書寫": ["finished", "topic", "created"],
};

// 個別類型用不到群組預設的欄位：關鍵字是專有名詞，沒有翻譯與發音
const KIND_COLUMNS: Record<string, string[]> = {
  關鍵字: ["topic", "start_year", "end_year", "created"],
  佳句: ["locator", "topic", "created"],
};

// 書籍的卡片要像書牆：封面直式、照最近讀過排序，另有閱讀中
const BOOK_CARD = `    image: note.cover
    imageFit: contain
    imageAspectRatio: 1.45
    sort:
      - property: last_read
        direction: DESC
`;
const readingView = `  - type: cards
    name: 閱讀中
    filters:
      and:
        - status == "閱讀中"
    cardSize: 120
    image: note.cover
    imageFit: contain
    imageAspectRatio: 1.45
    order:
      - file.name
`;

/**
 * 每個類型一個 Base，放在層的資料夾（01 紀錄/書籍.base），頁面本身在下一層（01 紀錄/書籍/）。
 * 第一個檢視是卡片（預設開啟），每個檢視都帶 summary；另有表格、依領域分組、地圖（有座標才加）
 */
export function kindBase(
  folder: string,
  { image: hasImage, map = false }: { image: boolean; map?: boolean },
): ExportFile {
  const group = folder.split("/").at(-2)!; // 99 資料/01 紀錄/書籍 → 01 紀錄
  const kind = folder.split("/").pop()!;
  const columns = ["file.name", "summary", ...(KIND_COLUMNS[kind] ?? GROUP_COLUMNS[group] ?? [])];
  const order = columns.map((c) => `      - ${c}`).join("\n");
  const cardOrder = ["file.name", "summary", "formula.留白", "formula.類別"].map((c) => `      - ${c}`).join("\n");
  const isBook = kind === "書籍";
  const image = isBook ? BOOK_CARD : hasImage ? "    image: note.cover\n    imageFit: cover\n" : "";
  const content = `filters:
  and:
    - file.inFolder("${folder}")
    - file.ext == "md"
formulas:
  # 卡片高度是 Obsidian 依欄位數算的；摘要下面多一個空欄位，讓摘要可以長到兩行（CSS 把它藏起來）
  留白: '""'
  類別: 'if(topic && topic != domain, domain + " · " + topic, domain)'
${propertiesYaml()}
views:
  - type: cards
    name: 卡片
    cardSize: 170
${image}    order:
${cardOrder}
${isBook ? readingView : ""}  - type: table
    name: 表格
    order:
${order}
    summaries:
      file.name: Count
  - type: table
    name: 依領域
    groupBy:
      property: domain
      direction: ASC
    order:
${order}
${map ? MAP_VIEW : ""}`;
  return { path: `${group}/${kind}.base`, content };
}

// 表格欄位的中文名稱；卡片上的欄位名稱由 CSS 藏起來
export const PROPERTY_NAMES: Record<string, string> = {
  "file.name": "名稱",
  summary: "摘要",
  creator: "作者",
  topic: "主題",
  domain: "領域",
  last_read: "最近閱讀",
  started: "開始",
  finished: "完成",
  status: "狀態",
  created: "建立",
  start_year: "起始年",
  end_year: "結束年",
  locator: "段落",
  translation: "翻譯",
  pronunciation: "發音",
  platform: "平台",
  reads: "次數",
  series: "系列",
  order: "順序",
  type: "類型",
  tags: "標籤",
  分類: "分類",
  "formula.類別": "類別",
};

export const propertiesYaml = (): string =>
  [
    "properties:",
    ...Object.entries(PROPERTY_NAMES).flatMap(([k, v]) => [
      `  ${k.includes(".") ? k : `note.${k}`}:`,
      `    displayName: ${v}`,
    ]),
  ].join("\n");

// Maps 外掛（Obsidian 官方）的地圖檢視；座標欄位格式是 "緯度, 經度"
const MAP_VIEW = `  - type: map
    name: 地圖
    filters:
      and:
        - coordinates != null
    coordinates: note.coordinates
    order:
      - file.name
      - topic
`;

const lastMonths = (today: string, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - (n - 1 - i));
    return d.toISOString().slice(0, 7);
  });

export type NoteStat = Record<string, string | undefined>;

/** frontmatter 裡統計會用到的單值欄位；YAML 字串的引號拿掉 */
export function statFields(text: string): NoteStat {
  const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  return Object.fromEntries(
    [...fm.matchAll(/^([^\s:][^:]*):[ \t]*(.+)$/gm)].map(([, k, v]) => [
      k.trim(),
      v.trim().replace(/^"(.*)"$/, "$1"),
    ]),
  );
}

// 作品用「讀完」算時間，其他用建立日期
const WORK_KINDS = new Set(["書籍", "影集", "影片", "文章"]);

/**
 * 每個類型一頁統計，跟 base 放在同一層（01 紀錄/書籍統計.md）。
 * 吃的是 vault 裡的 frontmatter，所以使用者自己的筆記（思緒、工作名詞、素材）也算得到
 */
export function renderKindStats(folder: string, notes: NoteStat[], today: string): ExportFile {
  const group = folder.split("/").at(-2)!;
  const kind = folder.split("/").pop()!;
  const isWork = WORK_KINDS.has(kind) && group === "01 紀錄";
  const unit = isWork ? "本" : "則";
  const months = lastMonths(today, 12);
  const dateOf = (n: NoteStat) => (isWork ? n.finished || n.last_read : n.created) ?? "";
  const added = countBy(notes, (n) => dateOf(n).slice(0, 7) || null);
  const byMonth = new Map(months.map((m) => [`${Number(m.slice(5))}月`, added.get(m) ?? 0]));
  const byYear = new Map(
    [...countBy(notes, (n) => dateOf(n).slice(0, 4) || null)].sort(([a], [b]) =>
      a.localeCompare(b),
    ),
  );
  const pieIf = (title: string, key: string) => {
    const counts = countBy(notes, (n) => n[key] || null);
    return counts.size > 1 ? [`## ${title}`, "", ...pieChart(title, counts)] : [];
  };
  const content = [
    "---",
    "type: 統計",
    "---",
    "",
    `# ${kind}統計`,
    "",
    `共 **${notes.length}** ${unit}`,
    "",
    `## 近 12 個月${isWork ? "讀完" : "新增"}`,
    "",
    ...barChart(isWork ? "每月讀完" : "每月新增", byMonth, unit),
    ...(byYear.size > 1
      ? [`## 每年${isWork ? "讀完" : "新增"}`, "", ...barChart("每年", byYear, unit)]
      : []),
    ...pieIf("領域", "domain"),
    ...pieIf("狀態", "status"),
    ...pieIf("語言", "language"),
    ...pieIf("分類", "分類"),
  ].join("\n");
  return { path: `${group}/${kind}統計.md`, content };
}
