"use client";

import { BookPagingMode, isPagingMode, useBookViewStore } from "@/store/useBookViewStore";
import { useUrlParams } from "@/lib/useUrlParam";

/**
 * 分頁／捲動是整個 app 共用的偏好：書單、文章列表、統計區塊都吃這個設定。
 *
 * 網址上的 `?mode=` 優先（分享連結、重新整理都回得到同一個畫面），
 * 沒指定時用設定頁存下來的偏好。
 */
export function usePagingMode(): { paging: BookPagingMode; scrolling: boolean } {
  const { paging: saved } = useBookViewStore();
  const { searchParams } = useUrlParams();
  const fromUrl = searchParams.get("mode");
  const paging = isPagingMode(fromUrl) ? fromUrl : saved;
  return { paging, scrolling: paging === "scroll" };
}
