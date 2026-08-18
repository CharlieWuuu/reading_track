"use client";

import { usePathname, useSearchParams } from "next/navigation";

/**
 * 關鍵字沒有編號，網址上就用名字本身；名字可能有斜線與空白，一律編碼。
 *
 * 帶著 from：關鍵字可以從卡片牆、樹狀圖、地圖、年代，或某張表單點進來，
 * 改完要回得到「剛才在看的那個畫面」，而不是一律丟回關鍵字頁。
 */
export function keywordEditHref(name: string, from?: string): string {
  const base = `/keywords/${encodeURIComponent(name)}/edit`;
  return from ? `${base}?from=${encodeURIComponent(from)}` : base;
}

/** 現在這個畫面的網址，含參數——分頁與看法都在參數裡，掉了就回到別的畫面 */
export function useCurrentHref(): string {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
