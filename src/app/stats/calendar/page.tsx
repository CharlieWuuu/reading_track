import { redirect } from "next/navigation";

/**
 * 月曆先降級成「一種看法」，現在再降級成統計頁裡的一張圖，網址跟著換。
 *
 * 這個 redirect 不能拿掉：它在 manifest.ts 的捷徑裡待過，
 * 已經把 app 裝到桌面的人，那顆捷徑指的還是舊網址。
 */
export default function CalendarStatsPage() {
  redirect("/records/books?view=stats");
}
