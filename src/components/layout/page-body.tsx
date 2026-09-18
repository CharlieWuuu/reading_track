type PageBodyProps = {
  children: React.ReactNode;
  scroll?: boolean; // false：捲動歸子元件，這裡只給高度
};

/** 頁面內容區，預設也是唯一的捲動容器。框線都畫在元素自己的框裡，橫向不必留餘裕 */
export function PageBody({ children, scroll = true }: PageBodyProps) {
  return (
    <div
      className={`flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden md:gap-5 ${scroll ? "overflow-y-auto" : "overflow-y-hidden"}`}
    >
      {children}
    </div>
  );
}
