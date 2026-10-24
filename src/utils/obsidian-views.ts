// Obsidian 端的瀏覽頁與統計頁：卡片牆、統計圖都由 vault 裡的 Dataview 檢視即時畫
import type { ExportFile } from "@/utils/obsidian-export";

const DIR = "01 紀錄"; // 跟書籍同一層

// 目錄一律用嵌入查詢（Dataview），不寫 [[連結]]——列出來不等於從屬，關聯圖會畫錯

// 閱讀紀錄：一次閱讀一列，集中在這張表；統計數的是紀錄，同一本讀兩次算兩次
const RECORDS = `99 資料/${DIR}/閱讀紀錄.md`;

export type RecordRow = {
  work: string; // 作品筆記的路徑（字串，不是連結，關聯圖才不會連過去）
  title: string;
  kind: string;
  started: string | null;
  finished: string | null;
  platform: string | null;
};

/** 閱讀紀錄表：資料放 frontmatter 給 Dataview 讀，內文是給人看的表格；作品名稱是純文字 */
export function renderRecords(rows: RecordRow[]): ExportFile {
  const sorted = [...rows].sort((a, b) =>
    String(b.finished ?? b.started ?? "").localeCompare(String(a.finished ?? a.started ?? "")),
  );
  const cell = (v: string | null) => (v ?? "").replace(/\|/g, "／");
  const content = [
    "---",
    "type: 閱讀紀錄",
    "records:",
    ...sorted.flatMap((r) => [
      `  - work: ${JSON.stringify(r.work)}`,
      ...(["title", "kind", "started", "finished", "platform"] as const)
        .filter((k) => r[k])
        .map((k) => `    ${k}: ${JSON.stringify(r[k])}`),
    ]),
    "---",
    "# 閱讀紀錄",
    "",
    "| 作品 | 類型 | 開始 | 結束 | 平台 |",
    "| --- | --- | --- | --- | --- |",
    ...sorted.map(
      (r) =>
        `| ${cell(r.title)} | ${cell(r.kind)} | ${cell(r.started)} | ${r.finished ?? "閱讀中"} | ${cell(r.platform)} |`,
    ),
  ].join("\n");
  return { path: RECORDS, content };
}

/** 閱讀統計：所有作品的閱讀紀錄合起來看，加上閱讀中的（書、影集…都算）；圖由 09 設定/views/統計 即時畫 */
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
    `await dv.view("09 設定/views/卡片牆", ${JSON.stringify({ folder: `99 資料/${DIR}`, status: "閱讀中", filters: false })})`,
    "```",
    "",
    // 每一次閱讀一段橫線，照 archivum 的 SpanTimeline
    "## 閱讀進度",
    "",
    "```dataviewjs",
    'await dv.view("09 設定/views/閱讀進度", {})',
    "```",
    "",
    "```dataviewjs",
    `await dv.view("09 設定/views/統計", ${JSON.stringify({ records: RECORDS, work: true })})`,
    "```",
  ].join("\n");
  return { path: `${DIR}/閱讀統計.md`, content };
}

// 作品用「讀完」算時間，其他用建立日期
const WORK_KINDS = new Set(["書籍", "影集", "影片", "文章"]);

/**
 * 每個類型一頁（01 紀錄/書籍.md），頁面本身在 99 資料/01 紀錄/書籍/。
 * 照 archivum 類型頁的「顯示方式」，同一頁切換卡片、動態、統計；版面在 vault 的 09 設定/views/類型（Dataview）。
 * 作品統計附作品裡的地方，關鍵字統計附所有地點的地圖
 */
export function kindPage(folder: string): ExportFile {
  const group = folder.split("/").at(-2)!; // 99 資料/01 紀錄/書籍 → 01 紀錄
  const kind = folder.split("/").pop()!;
  const work = WORK_KINDS.has(kind) && group === "01 紀錄";
  const map = kind === "關鍵字" ? "keyword" : work ? "kind" : null;
  const content = [
    "---",
    "type: 類型",
    "cssclasses: np-wide", // 不受內文欄寬限制，卡片牆左右撐滿
    "---",
    "```dataviewjs",
    `await dv.view("09 設定/views/類型", ${JSON.stringify({ folder, work, ...(map ? { map } : {}) })})`,
    "```",
  ].join("\n");
  return { path: `${group}/${kind}.md`, content };
}
