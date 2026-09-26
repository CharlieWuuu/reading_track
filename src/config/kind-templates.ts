import type { BookViewMode } from "@/stores/use-book-view-store";
import { CardStyle } from "./card-styles";
import { ModuleKey } from "./modules";
import { KindGroup } from "./record-kinds";

/**
 * 類型範本。**常駐**，不是一次性的初始資料。
 *
 * 使用者要「書籍」就套一份，欄位我們已經想好了，他不用自己想要有哪些。
 * 他把書籍刪掉，是他那份資料沒了——範本還在，隨時能再套一次。
 *
 * 模組名稱不在範本裡改：同一個模組到哪一種都叫同一個名字。
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
  /** 自己沒封面時用出處的封面。佳句與書寫是從某本書長出來的，單字關鍵字不是 */
  inheritsCover?: boolean;
  /** 清單上一筆的畫法。沒寫就用該 group 的預設 */
  cardStyle?: CardStyle;
  /** 有哪幾種看法。沒寫就用 DEFAULT_VIEWS */
  views?: readonly BookViewMode[];
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
      "longText",
      "cover",
      "amount",
      "externalId",
      "language",
      "platform",
      "topic",
      "attribute",
    ],
  },
  {
    key: "articles",
    group: "records",
    name: "文章",
    amountUnit: "字",
    modules: [...RECORD_BASE, "longText", "amount", "platform", "language", "topic", "attribute"],
  },
  {
    key: "movie",
    group: "records",
    name: "電影",
    amountUnit: "分鐘",
    modules: [...RECORD_BASE, "cover", "amount"],
  },
  {
    key: "podcast",
    group: "records",
    name: "Podcast",
    amountUnit: "分鐘",
    modules: [...RECORD_BASE, "amount"],
  },
  {
    key: "youtube",
    group: "records",
    name: "YouTube",
    amountUnit: "分鐘",
    modules: [...RECORD_BASE, "cover", "amount"],
  },
  {
    key: "exhibition",
    group: "records",
    name: "展覽",
    amountUnit: "小時",
    modules: [...RECORD_BASE, "cover"],
  },
  {
    key: "course",
    group: "records",
    name: "線上課程",
    amountUnit: "小時",
    modules: [...RECORD_BASE, "amount"],
  },
  {
    key: "quotes",
    inheritsCover: true,
    cardStyle: "quote", // 一句話排成引文，不切成方格
    group: "fragments",
    name: "佳句",
    amountUnit: "",
    modules: ["title", "locator", "endDate"],
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
      "example",
      "exampleTranslation",
      "locator",
      "endDate",
    ],
  },
  {
    key: "keywords",
    group: "fragments",
    name: "關鍵字",
    amountUnit: "",
    modules: ["title", "longText", "tags", "years", "coordinates", "externalUrl"],
  },
  {
    key: "reflection",
    inheritsCover: true,
    group: "writings",
    name: "心得",
    amountUnit: "字",
    modules: ["title", "longText", "endDate"],
  },
  {
    key: "thoughts",
    inheritsCover: true,
    group: "writings",
    name: "思緒",
    amountUnit: "字",
    modules: ["title", "longText", "endDate"],
  },
  {
    key: "weekly-plan",
    inheritsCover: true,
    group: "writings",
    name: "週計劃",
    amountUnit: "字",
    modules: ["title", "longText", "endDate"],
  },
  {
    key: "essay",
    inheritsCover: true,
    group: "writings",
    name: "論述",
    amountUnit: "字",
    modules: ["title", "longText", "externalUrl", "endDate"],
  },
  {
    key: "plan",
    inheritsCover: true,
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
