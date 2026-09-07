import { FieldKey, FieldLayer } from "./record-fields";

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

/** 哪一堆吃欄位庫的哪幾層。紀錄有作品那一層，片段沒有——一句話不會被讀第二次 */
export const GROUP_LAYERS: Record<KindGroup, FieldLayer[]> = {
  records: ["work", "record"],
  fragments: ["fragment"],
  writings: ["fragment"],
};

export type StatusSpec = { key: string; label: string };

/** 側欄那三堆。同一套類型機制，資料落在三張形狀不同的表 */
export type KindGroup = "records" | "fragments" | "writings";

export type KindSpec = {
  key: string;
  group: KindGroup;
  name: string;
  /** 份量的單位，跟著那一次走——有聲書是分鐘，紙本是頁。片段與專欄用不到 */
  amountUnit: string;
  fields: FieldSpec[];
  statuses: StatusSpec[];
};

/** 自己新增一種紀錄時給的狀態。用最通用的說法，不夠貼切就自己改 */
export const NEW_KIND_STATUSES: StatusSpec[] = [
  { key: "want", label: "想看" },
  { key: "reading", label: "進行中" },
  { key: "done", label: "已完成" },
];
