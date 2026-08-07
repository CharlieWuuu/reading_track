"use client";

import { useEffect } from "react";

/**
 * 安裝成 App（standalone）時鎖住縮放。
 *
 * 只在 standalone 生效，用瀏覽器開的時候維持可以放大——縮放是無障礙的
 * 基本需求，沒必要為了 App 的手感把它整個關掉。因為 display-mode 寫不進
 * 靜態的 meta，只能在執行時改。
 */
export function LockZoomInStandalone() {
  useEffect(() => {
    if (!window.matchMedia("(display-mode: standalone)").matches) return;

    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;

    const original = meta.getAttribute("content") ?? "";
    meta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
    );
    return () => meta.setAttribute("content", original);
  }, []);

  return null;
}
