import { FieldKey } from "./record-fields";

/**
 * 模組庫。使用者看到的是這一層，不是資料表的欄位——「進度與狀態」一個模組
 * 對到狀態、開始、結束三欄，勾一次就好。
 *
 * 通用表單畫的是「勾了哪些模組」，所以模組庫要蓋得住三個 group 的全部欄位——
 * 蓋不住的那幾欄就只能另外寫一支專用表單，同一個類型的新增與編輯也就長不一樣。
 *
 * 新模組的門檻本來寫「至少三個類型會用到」。那條擋的是憑空發明新欄位，
 * 不是禁止把 record-fields 已經有的欄位接上來——那些欄位資料表裡本來就在。
 */

export type ModuleDef = {
  key: string;
  label: string;
  /** 勾選畫面上的一行說明 */
  hint: string;
  /** 這個模組佔資料表哪幾欄 */
  fields: FieldKey[];
  /**
   * 這個模組存的是站內關聯，不是自己的欄位（所以 fields 是空的）。
   * 關聯一律落在 links_internal，表單上共用同一格——出處是書、關鍵字是片段，
   * 差別只在連到哪一種，chip 上標種類就分得出來，不必各給一個搜尋框。
   */
  links?: true;
};

export const MODULES = [
  // 紀錄存在 works.title，片段存在 fragments.name——同一個模組，兩張表的欄名不同
  { key: "title", label: "標題", hint: "一行字，清單上顯示的那個", fields: ["title"] },
  { key: "creator", label: "作者／來源人", hint: "誰講的、誰寫的", fields: ["creator"] },
  { key: "longText", label: "長文", hint: "多段落，支援分欄", fields: ["body"] },
  { key: "gloss", label: "解釋", hint: "對這個東西本身的說明", fields: ["translation"] },
  { key: "source", label: "出處", hint: "指向另一筆條目", fields: [], links: true },
  { key: "locator", label: "位置", hint: "出處裡的頁碼或時間點", fields: ["locator"] },
  { key: "cover", label: "封面圖", hint: "清單上的縮圖", fields: ["coverUrl"] },
  { key: "link", label: "外部連結", hint: "原始頁面，要有外開圖示", fields: ["sourceUrl"] },
  {
    key: "progress",
    label: "狀態",
    hint: "想／在／完，含日期區間",
    fields: ["startDate", "endDate"],
  },
  { key: "date", label: "單一日期", hint: "發生在哪一天", fields: ["endDate"] },
  { key: "keywords", label: "關鍵字", hint: "多對多，指向另一個片段", fields: [], links: true },
  { key: "amount", label: "量＋單位", hint: "頁／字／分鐘，統計讀這個", fields: ["amount"] },
  { key: "private", label: "私人", hint: "鎖起來，別人看不出存在", fields: ["isPrivate"] },
  { key: "pronunciation", label: "發音", hint: "怎麼唸", fields: ["pronunciation"] },
  { key: "context", label: "例句", hint: "這個詞用在句子裡長什麼樣", fields: ["context"] },
  {
    key: "contextTranslation",
    label: "例句翻譯",
    hint: "例句的意思",
    fields: ["contextTranslation"],
  },
  { key: "tags", label: "標籤", hint: "純文字，一行一個", fields: ["tags"] },
  { key: "span", label: "起訖", hint: "生卒、存續的那段年份", fields: ["span"] },
  { key: "coordinates", label: "座標", hint: "地圖上的位置", fields: ["coordinates"] },
  { key: "wiki", label: "維基連結", hint: "條目網址", fields: ["wikiUrl"] },
  { key: "language", label: "語言", hint: "這一筆是什麼語言", fields: ["language"] },
  { key: "externalId", label: "外部編號", hint: "ISBN、DOI 之類", fields: ["externalId"] },
  // key 不叫 source：那個給了「出處」那個關聯模組，這裡是自己打字的欄位
  { key: "publisher", label: "出版社", hint: "出版社／頻道／製作單位", fields: ["source"] },
  { key: "platform", label: "平台", hint: "在哪讀的、在哪看的", fields: ["platform"] },
  // 一個模組兩格：主題樹有父子，領域選完次領域才知道要列哪幾個
  {
    key: "topic",
    label: "領域",
    hint: "為什麼讀這一筆，含次領域",
    fields: ["domain", "subDomain"],
  },
  { key: "attribute", label: "屬性", hint: "小說／論述／散文這種分法", fields: ["attributeId"] },
] as const satisfies readonly ModuleDef[];

export type ModuleKey = (typeof MODULES)[number]["key"];

const BY_KEY = new Map<string, ModuleDef>(MODULES.map((m) => [m.key, m]));

export const moduleDef = (key: string): ModuleDef | undefined => BY_KEY.get(key);

/**
 * 一組模組展開成資料表欄位。同一欄被兩個模組指到只留一次。
 *
 * 片段那張表沒有 title 欄，它的標題叫 name——寫入那一層自己換，畫面只認 title，
 * 不然同一個模組要在表單上畫兩格。
 */
export const fieldsOfModules = (keys: readonly string[]): FieldKey[] => [
  ...new Set(keys.flatMap((key) => moduleDef(key)?.fields ?? [])),
];
