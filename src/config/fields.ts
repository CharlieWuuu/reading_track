/**
 * 欄位庫。三個 group 共用這一份，沒有「特有欄位」。
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
  | "text"
  | "longText"
  | "date"
  | "number"
  | "url"
  | "flag"
  | "topic"
  | "topicChild"
  | "image"
  | "attribute";

export type FieldDef = {
  key: string;
  layer: FieldLayer;
  type: FieldType;
  /** 沒被類型改名時用這個 */
  defaultLabel: string;
  /** 畫成幾行的文字框。沒寫就是單行；長文另有預設 */
  rows?: number;
  /** 值從既有資料的哪一組選項挑（見 useCategories）。有寫就畫成選單，一樣可以打字新增 */
  choices?: "platform" | "language";
};

/** 順序就是表單上的預設順序，改名不會插隊 */
export const FIELDS = [
  { key: "title", layer: "work", type: "text", defaultLabel: "標題", rows: 2 }, // 書名常常一行放不下
  { key: "creator", layer: "work", type: "text", defaultLabel: "創作者" },
  // 主題樹在表單上是兩格：領域挑父節點、次領域挑它底下的子節點。
  // 存的時候兩個一起換成 topic_id 那一個編號（見 mutations/taxonomy 的 typeIdFor）
  { key: "domain", layer: "work", type: "topic", defaultLabel: "領域" },
  { key: "subDomain", layer: "work", type: "topicChild", defaultLabel: "次領域" },
  { key: "attribute", layer: "work", type: "attribute", defaultLabel: "屬性" },
  { key: "language", layer: "work", type: "text", defaultLabel: "語言", choices: "language" },
  { key: "startDate", layer: "record", type: "date", defaultLabel: "開始" },
  { key: "endDate", layer: "record", type: "date", defaultLabel: "結束" },
  { key: "amount", layer: "work", type: "number", defaultLabel: "份量" }, // 頁數、片長是作品的，存在 works
  { key: "platform", layer: "record", type: "text", defaultLabel: "平台", choices: "platform" }, // 存選項表編號，掛在紀錄上
  { key: "publisher", layer: "work", type: "text", defaultLabel: "發行" }, // 出版社、媒體、片商都算,
  { key: "externalUrl", layer: "externalLink", type: "url", defaultLabel: "外部連結" },
  { key: "externalId", layer: "work", type: "text", defaultLabel: "外部編號" },
  // 存的是圖片 key 不是網址（舊資料可能還是外部網址），畫成上傳格不是文字框
  { key: "coverUrl", layer: "work", type: "image", defaultLabel: "封面" },
  { key: "isPrivate", layer: "record", type: "flag", defaultLabel: "私人" },
  // 片段：佳句、單字、關鍵字共用這幾欄，用不到的類型設成不顯示
  { key: "body", layer: "fragment", type: "longText", defaultLabel: "內文" },
  { key: "locator", layer: "fragment", type: "text", defaultLabel: "章節" },
  { key: "pronunciation", layer: "fragment", type: "text", defaultLabel: "發音" },
  { key: "translation", layer: "fragment", type: "text", defaultLabel: "解釋" },
  { key: "tags", layer: "fragment", type: "text", defaultLabel: "標籤" },
  { key: "startYear", layer: "fragment", type: "number", defaultLabel: "起" },
  { key: "endYear", layer: "fragment", type: "number", defaultLabel: "訖" },
  { key: "latitude", layer: "fragment", type: "number", defaultLabel: "緯度" },
  { key: "longitude", layer: "fragment", type: "number", defaultLabel: "經度" },
] as const satisfies readonly FieldDef[];

export type FieldKey = (typeof FIELDS)[number]["key"];

const BY_KEY = new Map<string, FieldDef>(FIELDS.map((f) => [f.key, f]));

export const fieldDef = (key: string): FieldDef | undefined => BY_KEY.get(key);

export const isFieldKey = (key: string): key is FieldKey => BY_KEY.has(key);

/**
 * 紀錄類存在作品表（works）的欄位：讀兩次同一本書，這些只有一份。
 *
 * body 在片段類存 fragments.body，在紀錄類存 works.body（摘要），所以欄位庫標片段層、
 * 這裡另外算進來——寫入那一層（mutations/catalog 的 workPatch）也是這樣分。
 */
export const isWorkField = (key: string): boolean =>
  key === "body" || BY_KEY.get(key)?.layer === "work";
