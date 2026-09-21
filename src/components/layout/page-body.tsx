type PageBodyProps = {
  children: React.ReactNode;
};

/** 頁面內容區，預設也是唯一的捲動容器。框線都畫在元素自己的框裡，橫向不必留餘裕 */
export function PageBody({ children }: PageBodyProps) {
  // flex-col 讓裡面的 flex-1 撐得開——載入中的轉圈圈靠這個才置中得了
  return <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-10">{children}</div>;
}
