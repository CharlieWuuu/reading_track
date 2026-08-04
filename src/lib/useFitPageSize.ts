"use client";

import { RefObject, useEffect, useLayoutEffect, useState } from "react";

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
  reserved = 96,
  /** 詳細檢視的卡片很高，手機上一頁只放得下一兩張，所以下限要能調 */
  minRows = MIN_ROWS
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

      setPageSize(Math.max(minRows, Math.floor(available / perRow)));
    }

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  });

  return pageSize;
}

/** 量測時標在每一筆上的屬性，用來取得實際渲染高度 */
export const FIT_ROW_ATTR = "data-fit-row";

/** 只算看得見的那組列表（手機卡片與桌機表格同時存在，另一組被 CSS 隱藏） */
function visibleRowHeights(el: HTMLElement): number[] {
  return Array.from(el.querySelectorAll<HTMLElement>(`[${FIT_ROW_ATTR}]`))
    .map((row) => row.getBoundingClientRect().height)
    .filter((height) => height > 0);
}

/**
 * 用估算值當起點，渲染後再量實際高度修正筆數：超出畫面就少一筆，
 * 底下還空得下一整筆才多一筆。欄高會因為換行、徽章而變動，純算數字容易失準。
 *
 * @param ref      列表容器（含翻頁列），量它的底邊有沒有超出可用區域
 * @param estimate 估算筆數，視窗大小改變時會重新給值
 * @param max      資料總筆數，避免在資料很少時無止盡地加
 */
export function useFitRowsByMeasure(
  ref: RefObject<HTMLElement | null>,
  estimate: number,
  max: number,
  enabled = true,
  minRows = MIN_ROWS
): number {
  // shrunk：這輪量測已經縮過就不再放大，否則會在「多一筆／少一筆」之間來回跳
  const [fit, setFit] = useState({ estimate, count: estimate, shrunk: false });

  // 視窗大小改變會給出新的估算值，這時回到估算值重新量一次
  if (fit.estimate !== estimate) {
    setFit({ estimate, count: estimate, shrunk: false });
  }

  const count = fit.estimate === estimate ? fit.count : estimate;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;

    const overflow = el.getBoundingClientRect().bottom - viewportBottom(el);

    if (overflow > 0.5) {
      setFit((f) => ({ ...f, count: Math.max(minRows, f.count - 1), shrunk: true }));
      return;
    }

    if (fit.shrunk || count >= max) return;

    const heights = visibleRowHeights(el);
    const rowHeight = heights.length ? Math.max(...heights) : 0;
    if (rowHeight > 0 && -overflow >= rowHeight) {
      setFit((f) => ({ ...f, count: f.count + 1 }));
    }
  }, [ref, enabled, count, max, fit.shrunk, minRows]);

  return Math.max(minRows, Math.min(count, Math.max(max, minRows)));
}
