// Obsidian 端的瀏覽頁與統計頁：卡片牆、統計圖都由 vault 裡的 Dataview 檢視即時畫
import type { ExportFile } from "@/utils/obsidian-export";

const DIR = "01 紀錄"; // 跟書籍同一層

// 目錄一律用嵌入查詢（Dataview），不寫 [[連結]]——列出來不等於從屬，關聯圖會畫錯

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
    "```dataviewjs",
    `await dv.view("09 設定/views/卡片牆", ${JSON.stringify({ folder: `99 資料/${DIR}/書籍`, status: "閱讀中", filters: false })})`,
    "```",
    "",
    "```dataviewjs",
    `await dv.view("09 設定/views/統計", ${JSON.stringify({ folder: `99 資料/${DIR}`, work: true })})`,
    "```",
  ].join("\n");
  return { path: `${DIR}/閱讀統計.md`, content };
}

/**
 * 每個類型一頁卡片牆，放在層的資料夾（01 紀錄/書籍.md），頁面本身在 99 資料/01 紀錄/書籍/。
 * 版面在 vault 的 09 設定/views/卡片牆（Dataview）：卡片依內容撐高、有封面放左邊，上面有領域、主題篩選。
 * 原本用 Bases，但 Bases 的卡片一律同高，長短不一的內容會留一大塊空白
 */
export function kindWall(folder: string): ExportFile {
  const group = folder.split("/").at(-2)!; // 99 資料/01 紀錄/書籍 → 01 紀錄
  const kind = folder.split("/").pop()!;
  const content = [
    "---",
    "type: 卡片牆",
    "cssclasses: np-wide", // 不受內文欄寬限制，卡片牆左右撐滿
    "---",
    "```dataviewjs",
    `await dv.view("09 設定/views/卡片牆", ${JSON.stringify({ folder })})`,
    "```",
  ].join("\n");
  return { path: `${group}/${kind}.md`, content };
}

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
