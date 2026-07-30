"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * 把檢視方式、第幾頁這種「看什麼」的狀態放進網址，
 * 這樣重新整理、上一頁、分享連結都會回到同一個畫面。
 *
 * 一律用 replace 而不是 push：翻頁不該把上一頁塞進瀏覽器歷史，
 * 不然使用者按返回鍵要按十次才離得開書單。
 */
export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /** 一次改多個參數；值給 null 就從網址移除（預設值不寫進網址，保持乾淨的 /books） */
  const setParams = useCallback(
    (changes: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) params.delete(key);
        else params.set(key, value);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return { searchParams, setParams };
}
