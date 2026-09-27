/**
 * 類型頁的表格：勾了哪些模組就有哪幾欄。純函式，不查資料。
 *
 * 只列放得進一格的模組——長文、封面、座標、內部連結、私人塞進表格讀不了，
 * 要看就進詳情頁。紀錄與片段兩種列形狀不同，缺的欄位就是空字串。
 */

/** 紀錄（RecordRow）與片段（FragmentRow）表格用得到的欄位，兩邊各有一部分 */
type Row = {
  title?: string;
  body?: string;
  creator?: string;
  translation?: string;
  pronunciation?: string;
  example?: string;
  locator?: string;
  platform?: string;
  publisher?: string;
  language?: string;
  domain?: string;
  subDomain?: string;
  attribute?: string;
  tags?: string;
  amount?: number | null;
  amountUnit?: string;
  startYear?: number | null;
  endYear?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  date?: string | null;
};

const text = (value: string | null | undefined) => value ?? "";

const CELLS: Record<string, (row: Row) => string> = {
  title: (row) => row.title || text(row.body),
  creator: (row) => text(row.creator),
  translation: (row) => text(row.translation),
  pronunciation: (row) => text(row.pronunciation),
  example: (row) => text(row.example),
  locator: (row) => text(row.locator),
  platform: (row) => text(row.platform),
  publisher: (row) => text(row.publisher),
  language: (row) => text(row.language),
  topic: (row) => [row.domain, row.subDomain].filter(Boolean).join(" / "),
  attribute: (row) => text(row.attribute),
  tags: (row) => text(row.tags),
  amount: (row) => (row.amount == null ? "" : `${row.amount} ${text(row.amountUnit)}`.trim()),
  years: (row) => [row.startYear, row.endYear].filter((year) => year != null).join("–"),
  startDate: (row) => text(row.startDate),
  endDate: (row) => text(row.endDate ?? row.date), // 片段只有一個日期，就是它的完成日
};

export type TableColumn = { key: string; label: string };

/** 照類型勾的順序與名字，只留放得進一格的 */
export const tableColumns = (modules: readonly TableColumn[]): TableColumn[] =>
  modules.filter((module) => module.key in CELLS);

export const cellOf = (row: Row, key: string): string => CELLS[key]?.(row) ?? "";
