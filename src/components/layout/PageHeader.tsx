import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const styles = {
  // 頁首不捲動，所以自己包成一塊，底線也在裡面
  header: "flex shrink-0 flex-col gap-3 md:gap-5",
  bar: "flex shrink-0 flex-wrap items-center justify-between gap-2 md:gap-3",
  heading: "flex min-w-0 items-center gap-1",
  back: "-ml-1 flex size-7 shrink-0 items-center justify-center rounded text-gray-600 hover:bg-gray-100",
  title: "truncate text-base font-semibold",
  actions: "flex min-w-0 flex-1 items-center justify-end *:min-w-0", // *:min-w-0 讓傳進來的內容縮得下去
  line: "h-px shrink-0 bg-gray-900",
};

type PageHeaderProps = {
  title?: string; // 沒給就不顯示標題
  action?: React.ReactNode; // 頁首右側的操作區
  backHref?: string; // 有值就在標題左邊放一個返回箭頭
};

/** 頁首與它下面那條線，固定在 PageBody 上方不捲動 */
export function PageHeader({ title, action, backHref }: PageHeaderProps) {
  // 整條都沒東西就連線一起收掉
  if (!title && !action && !backHref) return null;

  return (
    <div className={styles.header}>
      <div className={styles.bar}>
        <div className={styles.heading}>
          {backHref && (
            <Link href={backHref} aria-label="返回" className={styles.back}>
              <ChevronLeft size={20} strokeWidth={1.5} aria-hidden />
            </Link>
          )}
          {title && <h2 className={styles.title}>{title}</h2>}
        </div>
        {/* 按鈕的插槽 */}
        <div className={styles.actions}>{action}</div>
      </div>

      <div className={styles.line} />
    </div>
  );
}
