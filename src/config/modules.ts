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
   * 這個模組在統計頁出哪幾張圖。沒寫就不出——標題、內文那些沒有統計的意義。
   *
   * 一個模組出好幾張是常態：完成日既是月度趨勢也是月曆，同一欄兩種問法。
   *
   * 標在模組不標在欄位：領域是一個模組佔 domain 與 subDomain 兩欄，
   * 但畫出來是同一張樹狀圖，照欄位跑會變成兩張。
   */
  stat?: readonly StatKind[];
};

/**
 * 統計圖的種類。一個類型勾了哪些模組，統計頁就自動有哪幾張圖——
 * 開「影集」勾了導演、片長、領域，不用寫程式就有「常看導演 Top 5」與「領域分布」。
 *
 * 月曆、數線、地圖、年代原本是平行的「看法」（StatsExtraView），要換頁才看得到。
 * 它們跟其他圖沒有本質差別——一樣是「勾了這個模組就畫得出來」，只是畫得大張些。
 * 併回來之後統計頁就是一整面，不必再選「怎麼看」。
 */
export type StatKind =
  | "ranking" // 出現最多的前幾名（作者、平台）
  | "distribution" // 佔比，圓餅或長條（語言、屬性）
  | "tree" // 有父子兩層的佔比（領域＋次領域）
  | "sum" // 總和與平均（頁數、字數）
  | "trend" // 月度趨勢（完成日）
  | "calendar" // 哪天做了什麼——有完成日就畫得出來
  | "timeline" // 一段一段的區間，要有開始與完成
  | "map" // 地圖，要有經緯度
  | "era"; // 年代軸，要有起訖年

export const MODULES = [
  // 紀錄存在 works.title，片段存在 fragments.name——同一個模組，兩張表的欄名不同
  // 關聯不佔自己的欄位：一律落在 links_internal，連到什麼由 chip 上的種類說
  { key: "links", label: "內部連結", fields: [], always: true },
  { key: "title", label: "標題", fields: ["title"] },
  {
    key: "creator",
    label: "作者／來源人",
    fields: ["creator"],
    stat: ["ranking"],
  },
  { key: "longText", label: "長文", fields: ["body"] },
  { key: "translation", label: "解釋", fields: ["translation"] },
  { key: "locator", label: "位置", fields: ["locator"] },
  { key: "cover", label: "封面圖", fields: ["coverUrl"] },
  {
    key: "externalUrl",
    label: "外部連結",
    fields: ["externalUrl"],
  },
  // 兩格日期各自是一個模組。合成一個「狀態」的話它其實只是兩格日期——
  // 狀態是從日期推出來的（見 types/book 的 inferStatus），不是自己存的一欄。
  // 而且舊的「單一日期」也寫 endDate，跟「狀態」勾在一起會兩格寫同一欄
  {
    key: "startDate",
    label: "開始日期",
    fields: ["startDate"],
    stat: ["timeline"],
  },
  {
    key: "endDate",
    label: "完成日期",
    fields: ["endDate"],
    stat: ["trend", "calendar"],
  },
  {
    key: "amount",
    label: "量",
    fields: ["amount"],
    stat: ["sum"],
  },
  {
    key: "private",
    label: "私人",
    fields: ["isPrivate"],
    always: true,
  },
  { key: "pronunciation", label: "發音", fields: ["pronunciation"] },
  { key: "example", label: "例句", fields: ["example"] },
  {
    key: "exampleTranslation",
    label: "例句翻譯",
    fields: ["exampleTranslation"],
  },
  { key: "tags", label: "標籤", fields: ["tags"], stat: ["ranking"] },
  // 兩格各存一個數字：一欄塞 "1818－1883" 得靠剖析拆，破折號、西元前的負號都是坑
  {
    key: "years",
    label: "起訖年",
    fields: ["startYear", "endYear"],
    stat: ["era"],
  },
  {
    key: "coordinates",
    label: "座標",
    fields: ["latitude", "longitude"],
    stat: ["map"],
  },
  {
    key: "language",
    label: "語言",
    fields: ["language"],
    stat: ["distribution"],
  },
  { key: "externalId", label: "外部編號", fields: ["externalId"] },
  {
    key: "platform",
    label: "平台",
    fields: ["platform"],
    // 圓餅不是排行：平台的值就那幾個（實體書、Kobo、HyRead），
    // 想知道的是「電子書佔多少」，不是「第幾名」
    stat: ["distribution"],
  },
  // 一個模組兩格：主題樹有父子，領域選完次領域才知道要列哪幾個
  {
    key: "topic",
    label: "領域",
    fields: ["domain", "subDomain"],
    stat: ["tree"],
  },
  {
    key: "attribute",
    label: "屬性",
    fields: ["attribute"],
    stat: ["distribution"],
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
