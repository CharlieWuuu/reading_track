import { KindSpec, StatusSpec } from "./record-kinds";

/**
 * 預設類型。開帳號時灌進 record_kinds 的初始名單，灌完就是一般的資料——
 * 改名、改標籤、刪掉都行。程式不會回頭讀這裡驗證什麼。
 *
 * 片段那幾種 hidden 特別多，因為佳句、單字、關鍵字共用同一層欄位：
 * 一句話沒有發音，一個單字沒有座標。不是欄位不夠通用，是這一堆本來就雜。
 */

/** 讀完、看完、上完講的是同一件事，key 一樣才能跨類型合著算 */
const statuses = (want: string, doing: string, done: string): StatusSpec[] => [
  { key: "want", label: want },
  { key: "reading", label: doing },
  { key: "done", label: done },
];

export const DEFAULT_KINDS: KindSpec[] = [
  {
    key: "book",
    group: "records",
    name: "書籍",
    amountUnit: "頁",
    fields: [
      { key: "creator", label: "作者" },
      { key: "source", label: "出版社" },
      { key: "amount", label: "頁數" },
      { key: "externalId", label: "ISBN" },
    ],
    statuses: statuses("想讀", "閱讀中", "已讀完"),
  },
  {
    key: "article",
    group: "records",
    name: "文章",
    amountUnit: "字",
    fields: [
      { key: "creator", label: "作者" },
      { key: "source", label: "平台" },
      { key: "amount", label: "字數" },
      { key: "startDate", hidden: true }, // 一次就看完，沒有開始那一天
      { key: "coverUrl", hidden: true },
      { key: "externalId", hidden: true },
    ],
    statuses: statuses("想讀", "閱讀中", "已讀完"),
  },
  {
    key: "movie",
    group: "records",
    name: "電影",
    amountUnit: "分鐘",
    fields: [
      { key: "creator", label: "導演" },
      { key: "source", label: "平台" },
      { key: "amount", label: "片長" },
      { key: "startDate", hidden: true },
    ],
    statuses: statuses("想看", "觀看中", "已看完"),
  },
  {
    key: "podcast",
    group: "records",
    name: "Podcast",
    amountUnit: "分鐘",
    fields: [
      { key: "creator", label: "主持人" },
      { key: "source", label: "節目" },
      { key: "amount", label: "時長" },
      { key: "externalId", hidden: true },
    ],
    statuses: statuses("想聽", "收聽中", "已聽完"),
  },
  {
    key: "course",
    group: "records",
    name: "線上課程",
    amountUnit: "小時",
    fields: [
      { key: "creator", label: "講師" },
      { key: "source", label: "平台" },
      { key: "amount", label: "時數" },
      { key: "externalId", hidden: true },
    ],
    statuses: statuses("想上", "上課中", "已上完"),
  },
  {
    key: "quote",
    group: "fragments",
    name: "佳句",
    amountUnit: "",
    fields: [
      { key: "name", hidden: true }, // 一句話沒有名字，內文就是它自己
      { key: "body", label: "原文" },
      { key: "locator", label: "章節" },
      { key: "pronunciation", hidden: true },
      { key: "translation", hidden: true },
      { key: "context", hidden: true },
      { key: "contextTranslation", hidden: true },
      { key: "topics", hidden: true },
      { key: "span", hidden: true },
      { key: "coordinates", hidden: true },
      { key: "wikiUrl", hidden: true },
    ],
    statuses: [],
  },
  {
    key: "vocabulary",
    group: "fragments",
    name: "單字",
    amountUnit: "",
    fields: [
      { key: "name", label: "單字" },
      { key: "body", hidden: true },
      { key: "translation", label: "字義" },
      { key: "context", label: "例句" },
      { key: "contextTranslation", label: "例句翻譯" },
      { key: "topics", hidden: true },
      { key: "span", hidden: true },
      { key: "coordinates", hidden: true },
      { key: "wikiUrl", hidden: true },
    ],
    statuses: [],
  },
  {
    key: "keyword",
    group: "fragments",
    name: "關鍵字",
    amountUnit: "",
    fields: [
      { key: "name", label: "詞條" },
      { key: "body", label: "維基摘要" },
      { key: "locator", hidden: true },
      { key: "pronunciation", hidden: true },
      { key: "translation", hidden: true },
      { key: "context", hidden: true },
      { key: "contextTranslation", hidden: true },
    ],
    statuses: [],
  },
  {
    key: "writing",
    group: "writings",
    name: "書寫",
    amountUnit: "",
    fields: [
      { key: "name", label: "標題" },
      { key: "body", label: "內文" },
      { key: "locator", hidden: true },
      { key: "pronunciation", hidden: true },
      { key: "translation", hidden: true },
      { key: "context", hidden: true },
      { key: "contextTranslation", hidden: true },
      { key: "topics", hidden: true },
      { key: "span", hidden: true },
      { key: "coordinates", hidden: true },
      { key: "wikiUrl", hidden: true },
    ],
    statuses: [],
  },
];
