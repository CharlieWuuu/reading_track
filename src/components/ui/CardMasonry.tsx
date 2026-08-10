"use client";

import Masonry from "react-masonry-css";

/** 網頁版一列三張，往下逐級收成兩張、一張 */
const BREAKPOINTS = { default: 3, 1024: 2, 640: 1 };

/**
 * 卡片牆。卡片高度本來就參差，格線排會留下一堆空白，改成瀑布式往上補。
 * 套件只負責把卡片分進各欄，間距仍由這裡的 class 決定。
 */
export function CardMasonry({ children }: { children: React.ReactNode }) {
  return (
    <Masonry
      breakpointCols={BREAKPOINTS}
      className="flex gap-3"
      columnClassName="flex w-0 flex-1 flex-col gap-3"
    >
      {children}
    </Masonry>
  );
}
