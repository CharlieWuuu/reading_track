/**
 * 欄位庫。三堆共用這一份，沒有「特有欄位」。
 *
 * 作者、導演、講師、主持人講的是同一件事，頁數、片長、集數也是——差別只在名字。
 * 所以類型能改的是標籤與可見性，資料表的欄位一動也不動。
 *
 * key 對到資料表的欄位名，改名要兩邊一起改；layer 決定它存在哪一張表。
 */

/** work：作品共用的；record：這一次的；fragment：摘出來的東西；
 * externalLink：外部連結，走 external_links，不在任何一張本體表上 */
export type FieldLayer = "work" | "record" | "fragment" | "externalLink";

export type FieldType =
  "text" | "longText" | "date" | "number" | "url" | "flag" | "topic" | "attribute";

export type FieldDef = {
  key: string;
  layer: FieldLayer;
  type: FieldType;
  /** 沒被類型改名時用這個 */
  defaultLabel: string;
};

/** 順序就是表單上的預設順序，改名不會插隊 */
export const RECORD_FIELDS = [
  { key: "title", layer: "work", type: "text", defaultLabel: "標題" },
  { key: "creator", layer: "work", type: "text", defaultLabel: "創作者" },
  { key: "topicId", layer: "work", type: "topic", defaultLabel: "主題" },
  { key: "attributeId", layer: "work", type: "attribute", defaultLabel: "屬性" },
  { key: "language", layer: "work", type: "text", defaultLabel: "語言" },
  { key: "startDate", layer: "record", type: "date", defaultLabel: "開始" },
  { key: "endDate", layer: "record", type: "date", defaultLabel: "結束" },
  { key: "amount", layer: "record", type: "number", defaultLabel: "份量" },
  { key: "source", layer: "work", type: "text", defaultLabel: "來源" },
  { key: "sourceUrl", layer: "externalLink", type: "url", defaultLabel: "連結" },
  { key: "externalId", layer: "work", type: "text", defaultLabel: "外部編號" },
  { key: "coverUrl", layer: "work", type: "url", defaultLabel: "封面" },
  { key: "isPrivate", layer: "record", type: "flag", defaultLabel: "私人" },
  // 片段：佳句、單字、關鍵字共用這幾欄，用不到的類型設成不顯示
  { key: "name", layer: "fragment", type: "text", defaultLabel: "名稱" },
  { key: "body", layer: "fragment", type: "longText", defaultLabel: "內文" },
  { key: "locator", layer: "fragment", type: "text", defaultLabel: "章節" },
  { key: "pronunciation", layer: "fragment", type: "text", defaultLabel: "發音" },
  { key: "translation", layer: "fragment", type: "text", defaultLabel: "翻譯" },
  { key: "context", layer: "fragment", type: "longText", defaultLabel: "例句" },
  { key: "contextTranslation", layer: "fragment", type: "text", defaultLabel: "例句翻譯" },
  { key: "tags", layer: "fragment", type: "text", defaultLabel: "標籤" },
  { key: "span", layer: "fragment", type: "text", defaultLabel: "起訖" },
  { key: "coordinates", layer: "fragment", type: "text", defaultLabel: "座標" },
  { key: "wikiUrl", layer: "externalLink", type: "url", defaultLabel: "維基連結" },
] as const satisfies readonly FieldDef[];

export type FieldKey = (typeof RECORD_FIELDS)[number]["key"];

const BY_KEY = new Map<string, FieldDef>(RECORD_FIELDS.map((f) => [f.key, f]));

export const fieldDef = (key: string): FieldDef | undefined => BY_KEY.get(key);

export const isFieldKey = (key: string): key is FieldKey => BY_KEY.has(key);
