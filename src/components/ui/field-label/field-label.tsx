/**
 * 欄位的標籤。桌機版跟輸入框平行，手機版擺上面一行。
 *
 * 寬度固定、文字靠右：欄名長短不一，靠右才會緊貼著自己的輸入框，
 * 不然兩個字的欄名跟框中間會空一段。四個中文字剛好塞得下。
 */
export const FIELD_LABEL_CLASS =
  "mb-1 flex items-center gap-1.5 text-label font-medium tracking-label text-ink-faint uppercase md:mb-0 md:justify-end md:text-right";

/** 固定寬的那一欄。四個中文字剛好塞得下 */
const FIXED_WIDTH = "md:w-16 md:shrink-0";

/** 平行時輸入框那一欄：撐滿剩下的寬度，min-w-0 才不會被內容撐破 */
export const FIELD_CONTROL_CLASS = "min-w-0 md:flex-1";

/**
 * 輸入框長相：只畫下緣一條線。
 *
 * 整框的樣子在一頁十幾個欄位時會變成十幾個方塊，比填進去的字還搶眼；
 * 底線只標「這裡可以寫字」。左右不留內距——沒有框，字就該對齊標籤那條線。
 * 聚焦時線變成主色，不靠外框也看得出游標在哪一欄。
 */
export const FIELD_INPUT_CLASS =
  "border-0 border-b border-rule bg-transparent px-0 py-1.5 placeholder:text-gray-400 focus:border-b-2 focus:border-accent focus:outline-none focus:py-[calc(0.375rem-1px)]";

/**
 * 多行輸入框長相：這個要整框。
 *
 * 單行用底線是因為一頁十幾個欄位，整框會變成十幾個方塊比字還搶眼；多行不一樣，
 * 空白的 textarea 只有一條底線看不出能寫幾行，也看不出範圍到哪裡。
 */
export const FIELD_TEXTAREA_CLASS =
  "rounded-control border border-rule bg-transparent px-3 py-2 placeholder:text-gray-400 focus:border-accent focus:outline-none";

/** 標籤與輸入框的外框：手機版直排，md 以上並排 */
export const FIELD_ROW_CLASS = "min-w-0 md:flex md:items-center md:gap-2";

/** 只有欄名。說明走 placeholder，不掛在標籤旁邊當一行小字 */
export function FieldLabel({ label }: { label: string }) {
  return <label className={`${FIELD_LABEL_CLASS} ${FIXED_WIDTH}`}>{label}</label>;
}
