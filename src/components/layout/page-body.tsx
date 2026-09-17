/**
 * 頁面內容區，預設也是唯一的捲動容器——頁首固定不動。
 *
 * flex 欄：子元件才拿得到明確高度，月曆、書單那種「剛好一畫面」的版型靠 flex-1 排。
 *
 * `px-1 -mx-1`：overflow-y-auto 會把另一軸的 visible 變成 auto（CSS 規定），
 * 貼著左右邊緣的 ring 與 shadow 會被切掉。留一格餘裕再用負 margin 抵銷，版面寬度不變。
 *
 * `scroll={false}`：子元件自己有多欄捲動（概覽頁的月份格線＋窄欄各捲各的），
 * 這裡只給高度，捲軸歸那一層。
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
      className={`-mx-1 flex min-h-0 flex-1 flex-col gap-3 px-1 md:gap-5 ${scroll ? "overflow-y-auto" : "overflow-hidden"}`}
    >
      {children}
    </div>
  );
}
