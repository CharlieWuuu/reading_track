/**
 * 欄位的標籤。桌機版跟輸入框平行，手機版擺上面一行。
 *
 * 寬度固定，一整排欄位的輸入框左緣才對得齊；四個中文字剛好，
 * 更長的欄名（例如「開始日期」）也還在這個寬度裡。
 */
export const FIELD_LABEL_CLASS = "mb-1 flex items-center gap-1.5 text-sm font-medium md:mb-0";

/** 固定寬的那一欄；帶說明的標籤裝不下，那種就讓它照內容撐開 */
const FIXED_WIDTH = "md:w-16 md:shrink-0";

/** 平行時輸入框那一欄：撐滿剩下的寬度，min-w-0 才不會被內容撐破 */
export const FIELD_CONTROL_CLASS = "min-w-0 md:flex-1";

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
