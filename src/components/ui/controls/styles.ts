/**
 * 全站共用的動作按鈕與分頁列樣式。
 *
 * 高度、字級、圓角只定在這裡：同一列常同時出現按鈕與分頁列，各寫各的就會參差。
 * 這不是「頁首專用」的樣式，頁首與內文用的是同一套。
 */
export const CONTROL_HEIGHT = "h-8 md:h-9";
const HEIGHT = CONTROL_HEIGHT;
const TEXT = "text-xs font-medium md:text-sm";

export const styles = {
  primary: `flex ${HEIGHT} shrink-0 items-center rounded bg-gray-900 px-3 ${TEXT} text-white hover:bg-gray-700 md:px-4`,
  secondary: `flex ${HEIGHT} shrink-0 items-center gap-1 rounded border px-3 ${TEXT} text-gray-600 hover:bg-gray-100`,
  // 只佔自己的寬度，窄螢幕放不下時才在自己裡面橫捲
  // 邊框跟同一排的檢視切換用同一個灰階，兩顆控制項擺在一起才不會一深一淺
  tabs: `flex ${HEIGHT} w-fit max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-gray-300 p-1`,
  tab: `flex h-full shrink-0 items-center rounded px-2.5 ${TEXT} whitespace-nowrap md:px-3`,
  tabActive: "bg-gray-900 text-white",
  tabIdle: "text-gray-500 hover:bg-gray-100",
  menu: "absolute right-0 z-30 mt-1 flex min-w-32 flex-col rounded-lg border bg-white py-1 shadow-lg",
  menuItem: "flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50",
  viewToggle: `inline-flex ${HEIGHT} shrink-0 items-center rounded border border-gray-300 p-0.5`,
  viewButton: "flex h-full items-center rounded px-2",
  viewActive: "bg-gray-900 text-white",
  viewIdle: "text-gray-400 hover:bg-gray-100 hover:text-gray-700",
};
