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
 * 這裡的 class 必須寫成完整字串，Tailwind 是掃原始碼決定要產出哪些樣式的，
 * 用樣板字串拼出來的 class 不會被產生。
 */
export const TAG_COLORS = [
  "bg-rose-50 text-rose-800",
  "bg-orange-50 text-orange-800",
  "bg-amber-50 text-amber-800",
  "bg-lime-50 text-lime-800",
  "bg-green-50 text-green-800",
  "bg-emerald-50 text-emerald-800",
  "bg-teal-50 text-teal-800",
  "bg-cyan-50 text-cyan-800",
  "bg-sky-50 text-sky-800",
  "bg-blue-50 text-blue-800",
  "bg-indigo-50 text-indigo-800",
  "bg-violet-50 text-violet-800",
  "bg-purple-50 text-purple-800",
  "bg-fuchsia-50 text-fuchsia-800",
  "bg-pink-50 text-pink-800",
  "bg-stone-100 text-stone-700",
];

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

export function tagColorClass(tag: string, order: string[]): string {
  const index = order.indexOf(tag);
  return TAG_COLORS[(index >= 0 ? index : hash(tag)) % TAG_COLORS.length];
}
