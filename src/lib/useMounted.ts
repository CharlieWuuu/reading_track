"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * 是否已經在瀏覽器掛載完成。
 *
 * 頁面是靜態預先產生的，那份 HTML 裡的 sheetId／token 一定是空的，
 * 所以「請先連接」會先被畫出來、等 React 接手才換掉。判斷資料狀態前
 * 先等掛載，就不會閃那一下。
 *
 * 用 useSyncExternalStore 而不是 useEffect + setState：
 * 伺服器端回 false、瀏覽器端回 true，不會多一輪渲染。
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
