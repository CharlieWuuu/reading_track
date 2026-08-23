export type WritingView = "table" | "timeline";

/**
 * 預設時間軸：紀事是拿來一路往下讀的，表格是要找某一則時才切過去。
 *
 * 頁首與清單都要判斷現在是哪一種，所以規則收在這裡——兩邊各寫一次
 * 遲早會分岔（一邊改了預設值，另一邊沒改）。
 */
export const WRITING_VIEWS = {
  parse: (raw: string | null): WritingView => (raw === "table" ? "table" : "timeline"),
  /** 預設值不寫進網址，分享出去的連結才乾淨 */
  toParam: (view: WritingView): string | null => (view === "timeline" ? null : view),
};
