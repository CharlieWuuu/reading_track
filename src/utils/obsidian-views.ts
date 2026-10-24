// Obsidian 端的 base 與統計頁：base 是 Bases 設定，統計圖由 vault 裡的 Dataview 檢視即時畫
import type { ExportFile } from "@/utils/obsidian-export";

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

/** 閱讀統計：所有作品合起來看，加上閱讀中的書；圖由 09 設定/views/統計 即時畫 */
export function renderStats(): ExportFile {
  const content = [
    "---",
    "type: 統計",
    "---",
    "# 閱讀統計",
    "",
    "## 閱讀中",
    "",
    ...baseBlock(READING_VIEW),
    "",
    "```dataviewjs",
    `await dv.view("09 設定/views/統計", ${JSON.stringify({ folder: `99 資料/${DIR}`, work: true })})`,
    "```",
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

// 卡片欄位：留白越多，摘要能顯示的行數越多（CSS 依留白數決定裁幾行）
// 書籍左右排：封面在左、文字在右；書籍沒有摘要，只放書名、作者、分類，兩格留白撐高度；關鍵字要一眼看到解釋，給四行
const CARD_ORDER: Record<string, string[]> = {
  default: ["file.name", "summary", "formula.留白", "formula.類別"],
  書籍: ["file.name", "creator", "formula.留白", "formula.留白2", "formula.類別", "formula.封面"],
  關鍵字: [
    "file.name",
    "summary",
    "formula.留白",
    "formula.留白2",
    "formula.留白3",
    "formula.類別",
  ],
  // 佳句照 archivum 的 QuoteRow：一句一列，左邊出處的書封，右邊句子（標題，最多三行）與「—— 書名」
  佳句: ["file.name", "formula.留白", "formula.留白2", "formula.出處", "formula.封面"],
};

// 佳句本身沒有封面，借它出處那本書的
const QUOTE_FORMULAS = `  封面: 'if(note["書籍"], image(note["書籍"][0].asFile().properties.cover), "")'
  出處: 'if(note["書籍"], "—— " + note["書籍"][0].asFile().basename, "")'
`;

/**
 * 每個類型一個 Base，放在層的資料夾（01 紀錄/書籍.base），頁面本身在下一層（01 紀錄/書籍/）。
 * 第一個檢視是卡片（預設開啟），每個檢視都帶 summary；另有表格、依領域分組、地圖（有座標才加）
 */
export function kindBase(folder: string, { image: hasImage }: { image: boolean }): ExportFile {
  const group = folder.split("/").at(-2)!; // 99 資料/01 紀錄/書籍 → 01 紀錄
  const kind = folder.split("/").pop()!;
  const columns = ["file.name", "summary", ...(KIND_COLUMNS[kind] ?? GROUP_COLUMNS[group] ?? [])];
  const order = columns.map((c) => `      - ${c}`).join("\n");
  const isBook = kind === "書籍";
  const isQuote = kind === "佳句";
  const cardOrder = (CARD_ORDER[kind] ?? CARD_ORDER.default).map((c) => `      - ${c}`).join("\n");
  // 書籍的封面不用 Bases 的 image（那只能放卡片上方），改成 formula.封面 欄位，CSS 把它移到左邊
  const image = !isBook && hasImage ? "    image: note.cover\n    imageFit: cover\n" : "";
  const content = `filters:
  and:
    - file.inFolder("${folder}")
    - file.ext == "md"
formulas:
  # 卡片高度是 Obsidian 依欄位數算的；摘要下面多放空欄位，摘要才長得到多行（CSS 把它們藏起來）
  留白: '""'
  留白2: '""'
  留白3: '""'
  留白4: '""'
${isQuote ? QUOTE_FORMULAS : `  封面: 'if(cover, image(cover), "")'\n`}  # 清單：卡片上每一項畫成一個 code 標籤（CSS）
  類別: 'if(!domain, [], if(topic && topic != domain, [domain, topic], [domain]))'
${propertiesYaml()}
views:
  - type: cards
    name: 卡片
    cardSize: ${isBook ? 380 : isQuote ? 2000 : 230}
${image}    order:
${cardOrder}
    sort:
      - property: finished
        direction: DESC
      - property: created
        direction: DESC
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
`;
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

// 作品用「讀完」算時間，其他用建立日期
const WORK_KINDS = new Set(["書籍", "影集", "影片", "文章"]);

/**
 * 每個類型一頁統計，跟 base 放在同一層（01 紀錄/書籍統計.md）。
 * 圖由 vault 的 09 設定/views/統計 即時畫（Dataview），所以使用者自己的筆記也算得到、不用等匯出
 */
export function renderKindStats(folder: string): ExportFile {
  const group = folder.split("/").at(-2)!;
  const kind = folder.split("/").pop()!;
  const work = WORK_KINDS.has(kind) && group === "01 紀錄";
  const content = [
    "---",
    "type: 統計",
    "---",
    `# ${kind}統計`,
    "",
    "```dataviewjs",
    `await dv.view("09 設定/views/統計", ${JSON.stringify({ folder, work })})`,
    "```",
    // 作品統計加一張地圖：作品連到的、有座標的關鍵字；版面在 vault 的 09 設定/views/地圖
    // 關鍵字統計：所有有座標的地點，依領域上色（取代 base 裡 Maps 外掛的舊地圖）
    ...(kind === "關鍵字"
      ? ["", "## 地圖", "", "```dataviewjs", 'await dv.view("09 設定/views/地圖", {})', "```"]
      : []),
    ...(work
      ? [
          "",
          `## ${kind}裡的地方`,
          "",
          "```dataviewjs",
          `await dv.view("09 設定/views/地圖", ${JSON.stringify({ kind })})`,
          "```",
        ]
      : []),
  ].join("\n");
  return { path: `${group}/${kind}統計.md`, content };
}
