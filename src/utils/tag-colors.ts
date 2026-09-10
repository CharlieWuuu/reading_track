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
 * 色相取自靜野封面配色（cactus→dune→sky→brick→plum→straw→ash），只是
 * 標籤用的是同色相的淺底＋深字。刻意只留七個色相、各兩階——標籤是輔助
 * 辨識，顏色太多只會讓畫面變花。
 *
 * 這裡的 class 必須寫成完整字串，Tailwind 是掃原始碼決定要產出哪些樣式的，
 * 用樣板字串拼出來的 class 不會被產生。
 *
 * 用的是 primitive 層而不是 semantic：這是一輪固定順序的色相輪替，
 * 第幾個標籤配第幾階，沒有「這個顏色代表什麼」可講。
 */
export const TAG_COLORS = [
  "bg-cactus-100 text-cactus-700", // 仙人掌綠
  "bg-dune-100 text-dune-700", // 沙丘
  "bg-sky-100 text-sky-700", // 天空
  "bg-brick-100 text-brick-700", // 磚紅
  "bg-plum-100 text-plum-700", // 梅紫
  "bg-straw-100 text-straw-700", // 若線黃
  "bg-ash-100 text-ash-700", // 淡墨
  "bg-cactus-300 text-cactus-900", // 仙人掌綠（深）
  "bg-dune-300 text-dune-700", // 沙丘（深）
  "bg-sky-300 text-sky-700", // 天空（深）
  "bg-brick-300 text-brick-700", // 磚紅（深）
  "bg-plum-300 text-plum-700", // 梅紫（深）
  "bg-straw-300 text-straw-700", // 若線黃（深）
  "bg-ash-300 text-ash-700", // 淡墨（深）
];

/**
 * 同一組色相的外框版，給「屬性」用。
 *
 * 領域與屬性放在一起時，光靠色相分不出是哪一種分類——同樣是淺底彩字，
 * 看起來就是一排一樣的東西。改成一實一虛，用「樣式」而不是「顏色」區分類別。
 * 外框版不給底色：白底疊在交錯的年度底色上會變成一塊塊補丁。
 */
export const TAG_OUTLINE_COLORS = [
  "text-cactus-700 ring-1 ring-inset ring-cactus-300",
  "text-dune-700 ring-1 ring-inset ring-dune-300",
  "text-sky-700 ring-1 ring-inset ring-sky-300",
  "text-brick-700 ring-1 ring-inset ring-brick-300",
  "text-plum-700 ring-1 ring-inset ring-plum-300",
  "text-straw-700 ring-1 ring-inset ring-straw-300",
  "text-ash-700 ring-1 ring-inset ring-ash-300",
  "text-cactus-900 ring-1 ring-inset ring-cactus-500",
  "text-dune-700 ring-1 ring-inset ring-dune-500",
  "text-sky-700 ring-1 ring-inset ring-sky-500",
  "text-brick-700 ring-1 ring-inset ring-brick-500",
  "text-plum-700 ring-1 ring-inset ring-plum-500",
  "text-straw-700 ring-1 ring-inset ring-straw-500",
  "text-ash-700 ring-1 ring-inset ring-ash-500",
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

/** 不在選項清單裡的標籤（使用者自己打的）也要有固定顏色 */
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

/**
 * 封面帶的底色，取自靜野封面配色（cactus／dune／sky／brick／plum／straw／ash）。
 * 漸層下深上淺，跟書背陰影同一個光源方向——同一階降低不透明度當淺的一端，
 * 而不是跳到淺一階的色階，差距才不會蓋過色相本身的辨識度。這裡沒有文字疊
 * 在底色上（無封面時的字用固定的 text-ink-faint），不用顧慮對比，所以
 * 每色系用 300／700 兩階代表不同類別，差異比 500／700 更大——七色系湊出
 * 十四種可辨識的類別色。
 */
const COVER_TINTS = [
  "bg-gradient-to-t from-cactus-300 to-cactus-300/60",
  "bg-gradient-to-t from-cactus-700 to-cactus-700/60",
  "bg-gradient-to-t from-dune-300 to-dune-300/60",
  "bg-gradient-to-t from-dune-700 to-dune-700/60",
  "bg-gradient-to-t from-sky-300 to-sky-300/60",
  "bg-gradient-to-t from-sky-700 to-sky-700/60",
  "bg-gradient-to-t from-brick-300 to-brick-300/60",
  "bg-gradient-to-t from-brick-700 to-brick-700/60",
  "bg-gradient-to-t from-plum-300 to-plum-300/60",
  "bg-gradient-to-t from-plum-700 to-plum-700/60",
  "bg-gradient-to-t from-straw-300 to-straw-300/60",
  "bg-gradient-to-t from-straw-700 to-straw-700/60",
  "bg-gradient-to-t from-ash-300 to-ash-300/60",
  "bg-gradient-to-t from-ash-700 to-ash-700/60",
];

export function coverTintClass(seed: string): string {
  return COVER_TINTS[hash(seed) % COVER_TINTS.length];
}
