export type WritingView = "table" | "timeline";

/**
 * 表格找得快，時間軸讀得舒服；預設表格，因為進這一頁多半是要找某一則。
 *
 * 頁首與清單都要判斷現在是哪一種，所以規則收在這裡——兩邊各寫一次
 * 遲早會分岔（一邊改了預設值，另一邊沒改）。
 */
export const WRITING_VIEWS = {
  parse: (raw: string | null): WritingView => (raw === "timeline" ? "timeline" : "table"),
  /** 預設值不寫進網址，分享出去的連結才乾淨 */
  toParam: (view: WritingView): string | null => (view === "table" ? null : view),
};
