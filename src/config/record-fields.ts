/**
 * 欄位庫。所有類型共用這一份，沒有「特有欄位」。
 *
 * 作者、導演、講師、主持人講的是同一件事，頁數、片長、集數也是——差別只在名字。
 * 所以類型能改的是標籤與可見性，records／experiences 的欄位一動也不動。
 *
 * key 對到資料表的欄位名，改名要兩邊一起改；layer 決定它存在作品還是那一次體驗。
 */

export type FieldLayer = "record" | "experience";

export type FieldType = "text" | "date" | "number" | "url" | "flag" | "topic" | "attribute";

export type FieldDef = {
  key: string;
  layer: FieldLayer;
  type: FieldType;
  /** 沒被類型改名時用這個 */
  defaultLabel: string;
};

export const RECORD_FIELDS = [
  { key: "title", layer: "record", type: "text", defaultLabel: "標題" },
  { key: "creator", layer: "record", type: "text", defaultLabel: "創作者" },
  { key: "topicId", layer: "record", type: "topic", defaultLabel: "主題" },
  { key: "attributeId", layer: "record", type: "attribute", defaultLabel: "屬性" },
  { key: "language", layer: "record", type: "text", defaultLabel: "語言" },
  { key: "startDate", layer: "experience", type: "date", defaultLabel: "開始" },
  { key: "endDate", layer: "experience", type: "date", defaultLabel: "結束" },
  { key: "amount", layer: "experience", type: "number", defaultLabel: "份量" },
  { key: "source", layer: "experience", type: "text", defaultLabel: "來源" },
  { key: "sourceUrl", layer: "experience", type: "url", defaultLabel: "連結" },
  { key: "externalId", layer: "experience", type: "text", defaultLabel: "外部編號" },
  { key: "coverUrl", layer: "experience", type: "url", defaultLabel: "封面" },
  { key: "isPrivate", layer: "experience", type: "flag", defaultLabel: "私人" },
] as const satisfies readonly FieldDef[];

export type FieldKey = (typeof RECORD_FIELDS)[number]["key"];

const BY_KEY = new Map<string, FieldDef>(RECORD_FIELDS.map((f) => [f.key, f]));

export const fieldDef = (key: string): FieldDef | undefined => BY_KEY.get(key);

export const isFieldKey = (key: string): key is FieldKey => BY_KEY.has(key);
