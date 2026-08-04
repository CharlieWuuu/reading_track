import { BookCategories } from "@/types/book";

/**
 * 標籤配色。
 *
 * 每個標籤要「固定」是同一個顏色，否則同一個「心理」在不同列變色，
 * 顏色就不再有辨識作用。所以顏色是由標籤在選項清單裡的順序決定，
 * 而不是它在某一列裡排第幾個。
 *
 * 這裡的 class 必須寫成完整字串，Tailwind 是掃原始碼決定要產出哪些樣式的，
 * 用樣板字串拼出來的 class 不會被產生。
 */
export const TAG_COLORS = [
  "bg-rose-50 text-rose-800 ring-1 ring-rose-200",
  "bg-orange-50 text-orange-800 ring-1 ring-orange-200",
  "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  "bg-lime-50 text-lime-800 ring-1 ring-lime-200",
  "bg-green-50 text-green-800 ring-1 ring-green-200",
  "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  "bg-teal-50 text-teal-800 ring-1 ring-teal-200",
  "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200",
  "bg-sky-50 text-sky-800 ring-1 ring-sky-200",
  "bg-blue-50 text-blue-800 ring-1 ring-blue-200",
  "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200",
  "bg-violet-50 text-violet-800 ring-1 ring-violet-200",
  "bg-purple-50 text-purple-800 ring-1 ring-purple-200",
  "bg-fuchsia-50 text-fuchsia-800 ring-1 ring-fuchsia-200",
  "bg-pink-50 text-pink-800 ring-1 ring-pink-200",
  "bg-stone-100 text-stone-700 ring-1 ring-stone-200",
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
