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
   * 每個類型都有，不用勾——所以也不出現在設定頁的勾選清單裡。
   *
   * 標準是「少了它那個類型就不完整」：任何一筆都可能想連到別的東西，
   * 也都可能不想被同事瞄到。其餘一律讓使用者自己決定，不要替他預設。
   */
  always?: true;
  /**
   * 這個模組在統計頁出哪一種圖。沒寫就不出——標題、內文那些沒有統計的意義。
   *
   * 標在模組不標在欄位：領域是一個模組佔 domain 與 subDomain 兩欄，
   * 但畫出來是同一張樹狀圖，照欄位跑會變成兩張。
   */
  stat?: StatKind;
};

/**
 * 統計圖的種類。一個類型勾了哪些模組，統計頁就自動有哪幾張圖——
 * 開「影集」勾了導演、片長、領域，不用寫程式就有「常看導演 Top 5」與「領域分布」。
 */
export type StatKind =
  | "ranking" // 出現最多的前幾名（作者、平台）
  | "distribution" // 佔比，圓餅或長條（語言、屬性）
  | "tree" // 有父子兩層的佔比（領域＋次領域）
  | "sum" // 總和與平均（頁數、字數）
  | "trend"; // 月度趨勢（完成日）

export const MODULES = [
  // 紀錄存在 works.title，片段存在 fragments.name——同一個模組，兩張表的欄名不同
  // 關聯不佔自己的欄位：一律落在 links_internal，連到什麼由 chip 上的種類說
  { key: "links", label: "內部連結", hint: "連到站內任何一筆", fields: [], always: true },
  { key: "title", label: "標題", hint: "一行字，清單上顯示的那個", fields: ["title"] },
  {
    key: "creator",
    label: "作者／來源人",
    hint: "誰講的、誰寫的",
    fields: ["creator"],
    stat: "ranking",
  },
  { key: "longText", label: "長文", hint: "多段落，支援分欄", fields: ["body"] },
  { key: "translation", label: "解釋", hint: "對這個東西本身的說明", fields: ["translation"] },
  { key: "locator", label: "位置", hint: "出處裡的頁碼或時間點", fields: ["locator"] },
  { key: "cover", label: "封面圖", hint: "清單上的縮圖", fields: ["coverUrl"] },
  {
    key: "externalUrl",
    label: "外部連結",
    hint: "原始頁面，要有外開圖示",
    fields: ["externalUrl"],
  },
  // 兩格日期各自是一個模組。合成一個「狀態」的話它其實只是兩格日期——
  // 狀態是從日期推出來的（見 types/book 的 inferStatus），不是自己存的一欄。
  // 而且舊的「單一日期」也寫 endDate，跟「狀態」勾在一起會兩格寫同一欄
  { key: "startDate", label: "開始日期", hint: "開始的那一天", fields: ["startDate"] },
  { key: "endDate", label: "完成日期", hint: "完成的那一天", fields: ["endDate"], stat: "trend" },
  {
    key: "amount",
    label: "量＋單位",
    hint: "頁／字／分鐘，統計讀這個",
    fields: ["amount"],
    stat: "sum",
  },
  {
    key: "private",
    label: "私人",
    hint: "鎖起來，別人看不出存在",
    fields: ["isPrivate"],
    always: true,
  },
  { key: "pronunciation", label: "發音", hint: "怎麼唸", fields: ["pronunciation"] },
  { key: "example", label: "例句", hint: "這個詞用在句子裡長什麼樣", fields: ["example"] },
  {
    key: "exampleTranslation",
    label: "例句翻譯",
    hint: "例句的意思",
    fields: ["exampleTranslation"],
  },
  { key: "tags", label: "標籤", hint: "純文字，一行一個", fields: ["tags"], stat: "ranking" },
  // 兩格各存一個數字：一欄塞 "1818－1883" 得靠剖析拆，破折號、西元前的負號都是坑
  { key: "years", label: "起訖年", hint: "生卒、存續的那段年份", fields: ["startYear", "endYear"] },
  { key: "coordinates", label: "座標", hint: "地圖上的位置", fields: ["latitude", "longitude"] },
  {
    key: "language",
    label: "語言",
    hint: "這一筆是什麼語言",
    fields: ["language"],
    stat: "distribution",
  },
  { key: "externalId", label: "外部編號", hint: "ISBN、DOI 之類", fields: ["externalId"] },
  {
    key: "platform",
    label: "平台",
    hint: "在哪讀的、在哪看的",
    fields: ["platform"],
    stat: "ranking",
  },
  // 一個模組兩格：主題樹有父子，領域選完次領域才知道要列哪幾個
  {
    key: "topic",
    label: "領域",
    hint: "為什麼讀這一筆，含次領域",
    fields: ["domain", "subDomain"],
    stat: "tree",
  },
  {
    key: "attribute",
    label: "屬性",
    hint: "小說／論述／散文這種分法",
    fields: ["attribute"],
    stat: "distribution",
  },
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
