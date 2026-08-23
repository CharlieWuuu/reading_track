/**
 * 頁面內容區，也是唯一的捲動容器——頁首固定在上面不動。
 *
 * 做成 flex 欄，子元件才拿得到明確高度：月曆、書單那種「剛好一畫面」的
 * 版型靠 flex-1 排版，內容變長時 flex 項目會自己長高，多的部分照樣可以捲。
 *
 * 底部留一段 padding，捲到底時最後一行不會貼著螢幕邊。
 *
 * 裡面的卡片不要用 shadow 分區，用 border。`overflow-y-auto` 會讓另一軸的
 * visible 變成 auto（CSS 規定），所以陰影一到左右邊緣就被切掉，
 * 而且只要有東西比容器寬就會冒出橫向捲軸——裡面的卡片都要能縮（min-w-0）。
 * 外面 `app-shell` 的 main 是 overflow-hidden，那層也一樣切。
 */
export function PageBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4 md:gap-5">
      {children}
    </div>
  );
}
