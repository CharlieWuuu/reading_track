const styles = {
  bar: "flex shrink-0 flex-wrap items-center justify-between gap-2 md:gap-3",
  barHiddenOnMobile: "hidden md:flex",
  lineHiddenOnMobile: "hidden md:block",
  title: "hidden whitespace-nowrap text-base font-semibold md:block", // 手機靠底部導覽辨識頁面
  actions: "flex min-w-0 flex-1 items-center justify-end *:min-w-0", // *:min-w-0 讓傳進來的內容縮得下去
  line: "h-px shrink-0 bg-gray-900",
};

type PageHeaderProps = {
  title: string;
  action?: React.ReactNode; // 頁首右側的操作區
};

/** 頁首與它下面那條線，上下間距都由 main 的 gap 決定 */
export function PageHeader({ title, action }: PageHeaderProps) {
  // 手機不顯示標題，所以沒有 action 就整條沒東西可看；桌機照常，用 CSS 藏才不會閃
  const nothingOnMobile = !action;

  return (
    <>
      <div className={`${styles.bar} ${nothingOnMobile ? styles.barHiddenOnMobile : ""}`}>
        {/* 手機不顯示標題，寬度讓給操作區 */}
        <h2 className={styles.title}>{title}</h2>
        {/* 按鈕的插槽 */}
        <div className={styles.actions}>{action}</div>
      </div>

      <div className={`${styles.line} ${nothingOnMobile ? styles.lineHiddenOnMobile : ""}`} />
    </>
  );
}
