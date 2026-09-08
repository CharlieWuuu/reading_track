import { FieldKey } from "./record-fields";

/**
 * 模組庫。使用者看到的是這一層，不是資料表的欄位——「進度與狀態」一個模組
 * 對到狀態、開始、結束三欄，勾一次就好。
 *
 * 新模組的門檻：至少三個類型會用到。只有一個類型用得到的，那是那個類型的欄位，
 * 不是模組。這條規則擋的是模組庫被單一需求撐大。
 */

export type ModuleDef = {
  key: string;
  label: string;
  /** 勾選畫面上的一行說明 */
  hint: string;
  /** 這個模組佔資料表哪幾欄 */
  fields: FieldKey[];
};

export const MODULES = [
  { key: "title", label: "標題", hint: "一行字，清單上顯示的那個", fields: ["title", "name"] },
  { key: "creator", label: "作者／來源人", hint: "誰講的、誰寫的", fields: ["creator"] },
  { key: "longText", label: "長文", hint: "多段落，支援分欄", fields: ["body"] },
  { key: "oneLine", label: "一句話", hint: "單段，不折行的短內容", fields: ["body"] },
  { key: "gloss", label: "解釋", hint: "對這個東西本身的說明", fields: ["translation"] },
  { key: "source", label: "出處", hint: "指向另一筆條目", fields: [] },
  { key: "locator", label: "位置", hint: "出處裡的頁碼或時間點", fields: ["locator"] },
  { key: "cover", label: "封面圖", hint: "清單上的縮圖", fields: ["coverUrl"] },
  { key: "link", label: "外部連結", hint: "原始頁面，要有外開圖示", fields: ["sourceUrl"] },
  {
    key: "progress",
    label: "進度與狀態",
    hint: "想／在／完，含日期區間",
    fields: ["startDate", "endDate"],
  },
  { key: "date", label: "單一日期", hint: "發生在哪一天", fields: ["endDate"] },
  { key: "keywords", label: "關鍵字", hint: "多對多，指向另一個片段", fields: [] },
  { key: "amount", label: "量＋單位", hint: "頁／字／分鐘，統計讀這個", fields: ["amount"] },
  { key: "private", label: "私人", hint: "鎖起來，別人看不出存在", fields: ["isPrivate"] },
] as const satisfies readonly ModuleDef[];

export type ModuleKey = (typeof MODULES)[number]["key"];

const BY_KEY = new Map<string, ModuleDef>(MODULES.map((m) => [m.key, m]));

export const moduleDef = (key: string): ModuleDef | undefined => BY_KEY.get(key);

/** 一組模組展開成資料表欄位。同一欄被兩個模組指到只留一次 */
export const fieldsOfModules = (keys: readonly string[]): FieldKey[] => [
  ...new Set(keys.flatMap((key) => moduleDef(key)?.fields ?? [])),
];
