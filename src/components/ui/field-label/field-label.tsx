/**
 * 欄位的標籤。桌機版跟輸入框平行，手機版擺上面一行。
 *
 * 寬度固定、文字靠右：欄名長短不一，靠右才會緊貼著自己的輸入框，
 * 不然兩個字的欄名跟框中間會空一段。四個中文字剛好塞得下。
 */
export const FIELD_LABEL_CLASS =
  "mb-1 flex items-center gap-1.5 text-sm font-medium md:mb-0 md:justify-end md:text-right";

/** 固定寬的那一欄；帶說明的標籤裝不下，那種就讓它照內容撐開 */
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
  "border-0 border-b border-rule bg-transparent px-0 py-1.5 focus:border-accent focus:outline-none";

/** 標籤與輸入框的外框：手機版直排，md 以上並排 */
export const FIELD_ROW_CLASS = "min-w-0 md:flex md:items-center md:gap-2";

export function FieldLabel({
  label,
  hint,
}: {
  label: string;
  /** 標籤旁邊的淡字說明 */
  hint?: string;
}) {
  return (
    <label className={`${FIELD_LABEL_CLASS} ${hint ? "" : FIXED_WIDTH}`}>
      {label}
      {hint && <span className="text-xs font-normal text-gray-400">{hint}</span>}
    </label>
  );
}
