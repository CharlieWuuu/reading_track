/**
 * 頁面內容區。預設也是唯一的捲動容器——頁首固定在上面不動。
 *
 * 做成 flex 欄，子元件才拿得到明確高度：月曆、書單那種「剛好一畫面」的
 * 版型靠 flex-1 排版，內容變長時 flex 項目會自己長高，多的部分照樣可以捲。
 *
 * `overflow-y-auto` 會讓另一軸的 visible 變成 auto（CSS 規定），所以貼著左右
 * 邊緣的陰影與外框線一定被切掉——書封的 ring、卡片的 shadow 都會缺一條。
 * 用 `px-1 -mx-1` 在裡面留一格餘裕再用負 margin 抵銷：版面寬度不變，
 * 陰影有地方畫。這件事在這裡解決一次，各個清單就不用各自補 padding。
 *
 * 底部留 24px：捲到底時最後一行貼著螢幕邊會看不清楚，尤其手機。
 *
 * 只要有東西比容器寬就會冒出橫向捲軸——裡面的卡片都要能縮（min-w-0）。
 *
 * `scroll={false}`：子元件裡有自己的多欄捲動（例如概覽頁的月份格線＋窄欄，
 * 兩欄各捲各的），這裡就只給高度、不搶著當捲動容器，捲軸留給子元件自己開。
 */
export function PageBody({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  return (
    <div
      className={`-mx-1 flex min-h-0 flex-1 flex-col gap-3 px-1 pb-6 md:gap-5 ${scroll ? "overflow-y-auto" : "overflow-hidden"}`}
    >
      {children}
    </div>
  );
}
