import { FieldKey } from "./record-fields";

/**
 * 預設的類型。這些不是寫死的分類，是新使用者開帳號時灌進 record_kinds 的種子——
 * 灌完就是一般的資料，改名、改欄位標籤、刪掉都行。想不到的類型自己新增。
 *
 * 每一種只講三件事：欄位叫什麼名字、看不看得到、份量的單位是什麼。
 */

export type FieldSpec = {
  key: FieldKey;
  /** 不給就用欄位庫的預設標籤 */
  label?: string;
  hidden?: boolean;
};

export type StatusSpec = { key: string; label: string };

export type KindSpec = {
  key: string;
  name: string;
  /** 份量的單位，跟著那一次體驗走——有聲書是分鐘，紙本是頁 */
  amountUnit: string;
  fields: FieldSpec[];
  statuses: StatusSpec[];
};

/** 讀完、看完、上完講的是同一件事，key 一樣才能跨類型合著算 */
const statuses = (want: string, doing: string, done: string): StatusSpec[] => [
  { key: "want", label: want },
  { key: "reading", label: doing },
  { key: "done", label: done },
];

export const DEFAULT_KINDS: KindSpec[] = [
  {
    key: "book",
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
];
