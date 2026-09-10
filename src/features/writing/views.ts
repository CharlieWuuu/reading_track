export type WritingView = "table" | "card";

/**
 * 預設卡片：跟其他概覽頁（佳句、單字、專欄）同一套視覺語言，一則一張卡。
 * 表格是要找某一則時才切過去。
 *
 * 頁首與清單都要判斷現在是哪一種，所以規則收在這裡——兩邊各寫一次
 * 遲早會分岔（一邊改了預設值，另一邊沒改）。
 */
export const WRITING_VIEWS = {
  parse: (raw: string | null): WritingView => (raw === "table" ? "table" : "card"),
  /** 預設值不寫進網址，分享出去的連結才乾淨 */
  toParam: (view: WritingView): string | null => (view === "card" ? null : view),
};
