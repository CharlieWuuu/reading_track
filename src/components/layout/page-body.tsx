type PageBodyProps = {
  children: React.ReactNode;
  scroll?: boolean; // false：捲動歸子元件，這裡只給高度
};

/** 頁面內容區，預設也是唯一的捲動容器。`px-1 -mx-1` 是給 ring 與 shadow 的餘裕，會被 overflow 切掉 */
export function PageBody({ children, scroll = true }: PageBodyProps) {
  return (
    <div
      className={`-mx-1 flex min-h-0 flex-1 flex-col gap-3 px-1 md:gap-5 ${scroll ? "overflow-y-auto" : "overflow-hidden"}`}
    >
      {children}
    </div>
  );
}
