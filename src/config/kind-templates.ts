import { ModuleKey } from "./modules";
import { KindGroup, StatusSpec } from "./record-kinds";

/**
 * 類型範本。**常駐**，不是一次性的初始資料。
 *
 * 使用者要「書籍」就套一份，欄位我們已經想好了，他不用自己想要有哪些。
 * 他把書籍刪掉，是他那份資料沒了——範本還在，隨時能再套一次。
 *
 * 套完就是他的了：改名字、加減模組、改單位都行，改動不會回頭影響範本。
 */

export type KindTemplate = {
  key: string;
  group: KindGroup;
  name: string;
  /** 量的單位，統計讀它自己長句子 */
  amountUnit: string;
  modules: ModuleKey[];
  /** 狀態的說法。key 一樣才能跨類型合著算，label 各類型自己講 */
  statuses?: StatusSpec[];
  /** 模組在這個類型叫什麼。沒寫就用模組庫的預設名 */
  labels?: Partial<Record<ModuleKey, string>>;
};

const RECORD_BASE: ModuleKey[] = ["title", "creator", "link", "progress", "keywords", "private"];

/** 讀完、看完、上完講的是同一件事，key 一樣才能跨類型合著算 */
const statuses = (want: string, doing: string, done: string): StatusSpec[] => [
  { key: "want", label: want },
  { key: "reading", label: doing },
  { key: "done", label: done },
];

export const KIND_TEMPLATES: KindTemplate[] = [
  {
    key: "book",
    group: "records",
    name: "書籍",
    amountUnit: "頁",
    modules: [...RECORD_BASE, "cover", "amount"],
    statuses: statuses("想讀", "閱讀中", "已讀完"),
    labels: { creator: "作者", amount: "頁數" },
  },
  {
    key: "article",
    group: "records",
    name: "文章",
    amountUnit: "字",
    modules: [...RECORD_BASE, "date", "amount"],
    statuses: statuses("想讀", "閱讀中", "已讀完"),
    labels: { creator: "作者", amount: "字數" },
  },
  {
    key: "movie",
    group: "records",
    name: "電影",
    amountUnit: "分鐘",
    modules: [...RECORD_BASE, "cover", "date", "amount"],
    statuses: statuses("想看", "觀看中", "已看完"),
    labels: { creator: "導演", amount: "片長" },
  },
  {
    key: "podcast",
    group: "records",
    name: "Podcast",
    amountUnit: "分鐘",
    modules: [...RECORD_BASE, "date", "amount"],
    statuses: statuses("想聽", "收聽中", "已聽完"),
    labels: { creator: "主持人", amount: "時長" },
  },
  {
    key: "youtube",
    group: "records",
    name: "YouTube",
    amountUnit: "分鐘",
    modules: [...RECORD_BASE, "cover", "date", "amount"],
    statuses: statuses("想看", "觀看中", "已看完"),
    labels: { creator: "頻道", amount: "片長" },
  },
  {
    key: "exhibition",
    group: "records",
    name: "展覽",
    amountUnit: "小時",
    modules: [...RECORD_BASE, "cover", "date"],
    statuses: statuses("想去", "進行中", "去過了"),
    labels: { creator: "策展人", link: "官網" },
  },
  {
    key: "course",
    group: "records",
    name: "線上課程",
    amountUnit: "小時",
    modules: [...RECORD_BASE, "date", "amount"],
    statuses: statuses("想上", "上課中", "已上完"),
    labels: { creator: "講師", amount: "時數" },
  },
  {
    key: "quote",
    group: "fragments",
    name: "佳句",
    amountUnit: "",
    modules: ["oneLine", "source", "locator", "date", "keywords", "private"],
    labels: { oneLine: "原文" },
  },
  {
    key: "vocabulary",
    group: "fragments",
    name: "單字",
    amountUnit: "",
    modules: ["title", "oneLine", "gloss", "source", "locator", "date", "keywords", "private"],
    labels: { title: "單字", gloss: "字義", oneLine: "例句" },
  },
  {
    key: "keyword",
    group: "fragments",
    name: "關鍵字",
    amountUnit: "",
    modules: ["title", "gloss", "longText", "link", "private"],
    labels: { title: "詞條", gloss: "一句話說明", longText: "維基摘要" },
  },
  {
    key: "diary",
    group: "writings",
    name: "日記",
    amountUnit: "字",
    modules: ["title", "longText", "date", "keywords", "amount", "private"],
  },
  {
    key: "reflection",
    group: "writings",
    name: "心得",
    amountUnit: "字",
    modules: ["title", "longText", "source", "date", "keywords", "amount", "private"],
  },
  {
    key: "essay",
    group: "writings",
    name: "論述",
    amountUnit: "字",
    modules: ["title", "longText", "link", "date", "keywords", "amount", "private"],
  },
  {
    key: "plan",
    group: "writings",
    name: "每日計畫",
    amountUnit: "字",
    modules: ["title", "longText", "date", "private"],
  },
];

/** 開帳號時先給的那幾種。其餘留在範本庫裡，要用再套 */
export const STARTER_KEYS = new Set([
  "book",
  "article",
  "quote",
  "vocabulary",
  "keyword",
  "diary",
  "reflection",
]);

export const templatesOf = (group: KindGroup): KindTemplate[] =>
  KIND_TEMPLATES.filter((template) => template.group === group);

export const templateByKey = (key: string): KindTemplate | undefined =>
  KIND_TEMPLATES.find((template) => template.key === key);
