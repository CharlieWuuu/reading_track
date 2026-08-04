"use client";

import { BookPagingMode, useBookViewStore } from "@/store/useBookViewStore";

/**
 * 分頁／捲動是整個 app 共用的偏好：書單、文章列表、統計區塊都吃這個設定。
 *
 * 只存在設定裡（localStorage），不放網址——它是「這個人習慣怎麼看」，
 * 不是「這個畫面在看什麼」。放網址就得靠每個連結一路傳遞才不會掉，
 * 而且同一個狀態存兩份，改了設定還可能被舊網址蓋回去。
 */
export function usePagingMode(): { paging: BookPagingMode; scrolling: boolean } {
  const { paging } = useBookViewStore();
  return { paging, scrolling: paging === "scroll" };
}
