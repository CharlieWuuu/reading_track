type PageBodyProps = {
  children: React.ReactNode;
  scroll?: boolean; // false：捲動歸子元件，這裡只給高度
};

/**
 * 頁面內容區，預設也是唯一的捲動容器。
 *
 * 橫向用 clip 而不是 hidden：overflow-y 一旦不是 visible，另一軸就不能留 visible（CSS 規定），
 * 貼著左右邊緣的 ring 與 shadow 會被切平。clip 配 overflow-clip-margin 留 4px 餘裕，
 * 影子畫得出來，超寬的內容照樣關得住，也不必再用 px-1 -mx-1 把版面推回去。
 */
export function PageBody({ children, scroll = true }: PageBodyProps) {
  return (
    <div
      className={`flex min-h-0 flex-1 flex-col gap-3 md:gap-5 ${scroll ? "overflow-y-auto" : "overflow-y-hidden"}`}
      style={{ overflowX: "clip", overflowClipMargin: "4px" }}
    >
      {children}
    </div>
  );
}
