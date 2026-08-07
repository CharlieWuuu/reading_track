import { clearSWRCache } from "@/lib/swrCache";

/** 登出要清的都是跟帳號綁的；reading-track-sidebar 只是收合狀態，留著 */
const KEYS = ["reading-track-sheet", "reading-track-instapaper", "reading-track-book-view"];

export function clearLocalData() {
  if (typeof window === "undefined") return;
  clearSWRCache();
  for (const key of KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // 清不掉也不該擋住登出
    }
  }
}
