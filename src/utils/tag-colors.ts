import { BookCategories } from "@/types/book";

/**
 * 標籤配色。
 *
 * 每個標籤要「固定」是同一個顏色，否則同一個「心理」在不同列變色，
 * 顏色就不再有辨識作用。所以顏色是由標籤在選項清單裡的順序決定，
 * 而不是它在某一列裡排第幾個。
 *
 * 只有底色與文字色、沒有外框——跟閱讀狀態的徽章同一種風格，
 * 一排標籤放在一起才不會像一堆按鈕。
 *
 * 色相與圖表的 CATEGORICAL 是同一組品牌色（深藍→珊瑚橙→薄荷綠→金黃→…），
 * 只是標籤用的是同色相的淺底＋深字。刻意只留五個色相、各兩階——
 * 標籤是輔助辨識，十六種顏色只會讓畫面變花。
 *
 * 這裡的 class 必須寫成完整字串，Tailwind 是掃原始碼決定要產出哪些樣式的，
 * 用樣板字串拼出來的 class 不會被產生。
 *
 * 用的是 primitive 層而不是 semantic：這是一輪固定順序的色相輪替，
 * 第幾個標籤配第幾階，沒有「這個顏色代表什麼」可講。
 */
export const TAG_COLORS = [
  "bg-blue-100 text-blue-600", // 深藍
  "bg-coral-100 text-coral-700", // 珊瑚橙
  "bg-mint-100 text-mint-700", // 薄荷綠
  "bg-gold-100 text-gold-700", // 金黃
  "bg-azure-100 text-azure-700", // 柔和藍
  "bg-sand-200 text-sand-800", // 米白／深棕
  "bg-blue-200 text-blue-700", // 深藍（深）
  "bg-coral-200 text-coral-800", // 珊瑚橙（深）
  "bg-mint-200 text-mint-800", // 薄荷綠（深）
  "bg-gold-200 text-gold-800", // 金黃（深）
];

/**
 * 同一組色相的外框版，給「屬性」用。
 *
 * 領域與屬性放在一起時，光靠色相分不出是哪一種分類——同樣是淺底彩字，
 * 看起來就是一排一樣的東西。改成一實一虛，用「樣式」而不是「顏色」區分類別。
 * 外框版不給底色：白底疊在交錯的年度底色上會變成一塊塊補丁。
 */
export const TAG_OUTLINE_COLORS = [
  "text-blue-600 ring-1 ring-inset ring-blue-300",
  "text-coral-700 ring-1 ring-inset ring-coral-300",
  "text-mint-700 ring-1 ring-inset ring-mint-300",
  "text-gold-700 ring-1 ring-inset ring-gold-300",
  "text-azure-700 ring-1 ring-inset ring-azure-300",
  "text-sand-800 ring-1 ring-inset ring-sand-300",
  "text-blue-700 ring-1 ring-inset ring-blue-400",
  "text-coral-800 ring-1 ring-inset ring-coral-400",
  "text-mint-800 ring-1 ring-inset ring-mint-400",
  "text-gold-800 ring-1 ring-inset ring-gold-400",
];

/**
 * 依「欄位」上色：所有領域同一個顏色、所有次領域同一個顏色。
 *
 * 一列裡並排的標籤，讀者要先知道「這是哪一種分類」，才輪到「是哪一個值」。
 * 逐個標籤配色的話同一列會出現五種顏色，看起來像五件不重要的事各喊各的。
 * 次領域用領域的外框版：同一個色系代表它們是同一件事的粗細兩層。
 */
export const TAG_TONES = {
  domain: "bg-tag-domain-bg text-tag-domain-ink",
  subDomain: "text-tag-domain-ink ring-1 ring-inset ring-tag-domain-ring",
  platform: "bg-tag-platform-bg text-tag-platform-ink",
  type: "text-tag-type-ink ring-1 ring-inset ring-tag-type-ring",
  language: "bg-tag-language-bg text-tag-language-ink",
  article: "bg-tag-article-bg text-tag-article-ink",
} as const;

export type TagTone = keyof typeof TAG_TONES;

/**
 * 選項全部串起來當作配色順序，各類別之間也不會撞色。
 *
 * 各組都用 `?? []` 兜底：本機快取（swrCache）裡可能還躺著舊版本的回應，
 * 那時候還沒有「平台」這一組，直接展開會炸掉整頁。
 */
export function tagOrder(categories: Partial<BookCategories> | undefined): string[] {
  return [
    ...(categories?.platform ?? []),
    ...(categories?.domain ?? []),
    ...(categories?.type ?? []),
    ...(categories?.language ?? []),
  ];
}

/** 不在選項清單裡的標籤（使用者直接在 Sheet 手打的）也要有固定顏色 */
function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function tagColorClass(tag: string, order: string[], outline = false): string {
  const palette = outline ? TAG_OUTLINE_COLORS : TAG_COLORS;
  const index = order.indexOf(tag);
  return palette[(index >= 0 ? index : hash(tag)) % palette.length];
}
