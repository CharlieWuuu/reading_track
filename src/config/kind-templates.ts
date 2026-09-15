import { ModuleKey } from "./modules";
import { KindGroup } from "./record-kinds";

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
  /** 模組在這個類型叫什麼。沒寫就用模組庫的預設名 */
  labels?: Partial<Record<ModuleKey, string>>;
};

const RECORD_BASE: ModuleKey[] = ["title", "creator", "externalUrl", "startDate", "endDate"];

export const KIND_TEMPLATES: KindTemplate[] = [
  {
    key: "books",
    group: "records",
    name: "書籍",
    amountUnit: "頁",
    modules: [
      ...RECORD_BASE,
      "cover",
      "amount",
      "publisher",
      "externalId",
      "language",
      "platform",
      "topic",
      "attribute",
    ],
    labels: { creator: "作者", amount: "頁數", externalId: "ISBN" },
  },
  {
    key: "articles",
    group: "records",
    name: "文章",
    amountUnit: "字",
    modules: [...RECORD_BASE, "amount", "publisher", "language", "topic", "attribute"],
    labels: { creator: "作者", amount: "字數", publisher: "媒體" },
  },
  {
    key: "movie",
    group: "records",
    name: "電影",
    amountUnit: "分鐘",
    modules: [...RECORD_BASE, "cover", "amount"],
    labels: { creator: "導演", amount: "片長" },
  },
  {
    key: "podcast",
    group: "records",
    name: "Podcast",
    amountUnit: "分鐘",
    modules: [...RECORD_BASE, "amount"],
    labels: { creator: "主持人", amount: "時長" },
  },
  {
    key: "youtube",
    group: "records",
    name: "YouTube",
    amountUnit: "分鐘",
    modules: [...RECORD_BASE, "cover", "amount"],
    labels: { creator: "頻道", amount: "片長" },
  },
  {
    key: "exhibition",
    group: "records",
    name: "展覽",
    amountUnit: "小時",
    modules: [...RECORD_BASE, "cover"],
    labels: { creator: "策展人", externalUrl: "官網" },
  },
  {
    key: "course",
    group: "records",
    name: "線上課程",
    amountUnit: "小時",
    modules: [...RECORD_BASE, "amount"],
    labels: { creator: "講師", amount: "時數" },
  },
  {
    key: "quotes",
    group: "fragments",
    name: "佳句",
    amountUnit: "",
    modules: ["title", "locator", "endDate"],
    labels: { title: "原文" },
  },
  {
    key: "vocabulary",
    group: "fragments",
    name: "單字",
    amountUnit: "",
    modules: [
      "title",
      "pronunciation",
      "translation",
      "context",
      "contextTranslation",
      "locator",
      "endDate",
    ],
    labels: { title: "單字", translation: "字義" },
  },
  {
    key: "keywords",
    group: "fragments",
    name: "關鍵字",
    amountUnit: "",
    modules: ["title", "translation", "longText", "tags", "years", "coordinates", "externalUrl"],
    labels: {
      title: "詞條",
      translation: "一句話說明",
      longText: "維基摘要",
      tags: "學科",
      externalUrl: "維基連結",
    },
  },
  {
    key: "reflection",
    group: "writings",
    name: "心得",
    amountUnit: "字",
    modules: ["title", "longText", "endDate"],
  },
  {
    key: "thoughts",
    group: "writings",
    name: "思緒",
    amountUnit: "字",
    modules: ["title", "longText", "endDate"],
  },
  {
    key: "weekly-plan",
    group: "writings",
    name: "週計劃",
    amountUnit: "字",
    modules: ["title", "longText", "endDate"],
  },
  {
    key: "essay",
    group: "writings",
    name: "論述",
    amountUnit: "字",
    modules: ["title", "longText", "externalUrl", "endDate"],
  },
  {
    key: "plan",
    group: "writings",
    name: "每日計畫",
    amountUnit: "字",
    modules: ["title", "longText", "endDate"],
  },
];

/** 開帳號時先給的那幾種。其餘留在範本庫裡，要用再套 */
export const STARTER_KEYS = new Set([
  "books",
  "articles",
  "quotes",
  "vocabulary",
  "keywords",
  "reflection",
  "thoughts",
  "weekly-plan",
]);

export const templatesOf = (group: KindGroup): KindTemplate[] =>
  KIND_TEMPLATES.filter((template) => template.group === group);

export const templateByKey = (key: string): KindTemplate | undefined =>
  KIND_TEMPLATES.find((template) => template.key === key);
