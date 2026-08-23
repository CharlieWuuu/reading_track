/**
 * 全站共用的動作按鈕與分頁列樣式。
 *
 * 高度、字級、圓角只定在這裡：同一列常同時出現按鈕與分頁列，各寫各的就會參差。
 * 這不是「頁首專用」的樣式，頁首與內文用的是同一套。
 *
 * 顏色全走 control-* 這組 component token，色票本身在 src/styles/tokens/。
 * 高度留在這裡：它是 md 斷點的兩個值，token 表達不了。
 */
export const CONTROL_HEIGHT = "h-8 md:h-9";
const HEIGHT = CONTROL_HEIGHT;
const TEXT = "text-xs font-medium md:text-sm";

export const styles = {
  primary: `flex ${HEIGHT} shrink-0 items-center rounded-control bg-control-bg px-3 ${TEXT} text-control-ink hover:bg-control-bg-hover md:px-4`,
  // 只有一個圖示時左右不留文字的餘裕，寬度跟高度差不多才像一顆鍵
  primaryIcon: `flex ${HEIGHT} aspect-square shrink-0 items-center justify-center rounded-control bg-control-bg ${TEXT} text-control-ink hover:bg-control-bg-hover`,
  secondary: `flex ${HEIGHT} shrink-0 items-center gap-1 rounded-control border px-3 ${TEXT} text-control-ink-secondary hover:bg-control-ghost-hover`,
  // 沒有文字就不用留文字的左右餘裕；圖示旁邊還有一個 chevron，所以不做成正方形
  secondaryIcon: `flex ${HEIGHT} shrink-0 items-center gap-0.5 rounded-control border px-2 ${TEXT} text-control-ink-secondary hover:bg-control-ghost-hover`,
  // 一排選項：分頁與檢視切換共用這一組（SegmentedControl）
  // 只佔自己的寬度，窄螢幕放不下時才在自己裡面橫捲
  segmentBox: `flex ${HEIGHT} w-fit max-w-full items-center gap-1 overflow-x-auto rounded-control border border-control-border p-1`,
  segment: `flex h-full shrink-0 items-center rounded-control px-2.5 ${TEXT} whitespace-nowrap md:px-3`,
  // 小一號：放在圖表面板裡，跟頁首那排同一套長相但不搶圖的位置
  segmentBoxSm:
    "flex h-7 w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-control border border-control-border p-0.5",
  segmentSm:
    "flex h-full shrink-0 items-center rounded-control px-2 text-xs font-medium whitespace-nowrap",
  segmentActive: "bg-control-bg text-control-ink",
  segmentIdle: "text-control-ink-idle hover:bg-control-ghost-hover",
  menu: "absolute right-0 z-30 mt-1 flex min-w-32 flex-col rounded-surface border bg-control-menu-bg py-1 shadow-lg",
  menuItem: "flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-control-menu-hover",
};
