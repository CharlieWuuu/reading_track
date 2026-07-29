"use client";

import { RefObject, useEffect, useState } from "react";

const MIN_ROWS = 3;
const FALLBACK_ROWS = 10;

/**
 * 可用區域的底邊：內容區是 <main>，手機版底下還有導覽列，
 * 所以不能直接用 window.innerHeight。
 */
export function viewportBottom(el: HTMLElement): number {
  const main = el.closest("main");
  return main ? main.getBoundingClientRect().bottom : window.innerHeight;
}

/**
 * 依畫面剩餘高度算出一頁能放幾筆，讓列表剛好塞滿一個畫面、不用捲動就能翻頁。
 *
 * @param ref       列表容器，用它距離視窗頂端的位置推算可用高度
 * @param rowHeight 單筆高度（手機、桌機不同）
 * @param reserved  表頭與翻頁列等固定佔用的高度
 */
export function useFitPageSize(
  ref: RefObject<HTMLElement | null>,
  rowHeight: { mobile: number; desktop: number },
  reserved = 96
): number {
  const [pageSize, setPageSize] = useState(FALLBACK_ROWS);

  useEffect(() => {
    function recalc() {
      const el = ref.current;
      if (!el) return;

      const top = el.getBoundingClientRect().top;
      const isMobile = window.innerWidth < 768;
      const perRow = isMobile ? rowHeight.mobile : rowHeight.desktop;
      const available = viewportBottom(el) - top - reserved;

      setPageSize(Math.max(MIN_ROWS, Math.floor(available / perRow)));
    }

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  });

  return pageSize;
}
