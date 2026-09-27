type PageBodyProps = {
  children: React.ReactNode;
};

/**
 * 頁面內容區，預設也是唯一的捲動容器。框線都畫在元素自己的框裡，橫向不必留餘裕。
 *
 * 底部留白不在這裡：兩欄頁是各欄自己捲，留在這裡會變成捲動區外一條死白。
 * 誰捲誰留——PageBody 自己捲的頁面，在內容最外層加 pb-10。
 */
export function PageBody({ children }: PageBodyProps) {
  return <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>;
}
