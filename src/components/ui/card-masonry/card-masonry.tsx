"use client";

import Masonry from "react-masonry-css";

/**
 * 欄數跟著寬度一路長，每欄寬度才不會沒有上限一直被拉開——超寬螢幕不留白，
 * 卡片牆鋪滿可視寬度，用更多欄消化多出來的空間。手機維持兩張：卡片本來就矮，
 * 一列一張要滑很久。
 */
const BREAKPOINTS = {
  default: 10,
  2560: 8,
  1920: 6,
  1536: 5,
  1280: 4,
  1024: 3,
  768: 2,
};

/**
 * 卡片牆。卡片高度本來就參差，格線排會留下一堆空白，改成瀑布式往上補。
 * 套件只負責把卡片分進各欄，間距仍由這裡的 class 決定。
 */
export function CardMasonry({ children }: { children: React.ReactNode }) {
  return (
    <Masonry
      breakpointCols={BREAKPOINTS}
      className="flex min-w-0 gap-2 md:gap-3"
      columnClassName="flex w-0 min-w-0 flex-1 flex-col gap-2 md:gap-3"
    >
      {children}
    </Masonry>
  );
}
