type PageBodyProps = {
  children: React.ReactNode;
};

/** 頁面內容區，預設也是唯一的捲動容器。框線都畫在元素自己的框裡，橫向不必留餘裕 */
export function PageBody({ children }: PageBodyProps) {
  return <div className="overflow-y-auto pb-10">{children}</div>;
}
