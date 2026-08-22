"use client";

import { useEffect, useState } from "react";

/**
 * 過了門檻才回 true。
 *
 * 給「載入中」用：資料在 SWR 快取裡時只要幾十毫秒，轉圈圈閃一下比沒有更吵。
 * 慢的時候才需要告訴使用者「還在跑」。
 */
export function useDelayed(ms = 250): boolean {
  const [passed, setPassed] = useState(ms <= 0);

  useEffect(() => {
    if (ms <= 0) return;
    const timer = setTimeout(() => setPassed(true), ms);
    return () => clearTimeout(timer);
  }, [ms]);

  return passed;
}
