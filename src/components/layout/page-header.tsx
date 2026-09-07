import { BackLink } from "./back-link";

const styles = {
  // 頁首不捲動；與內容的間距由 app-shell 的 main 那層 gap 提供
  bar: "flex shrink-0 flex-wrap items-baseline justify-between gap-2 md:gap-3",
  heading: "flex min-w-0 items-baseline gap-2",
  back: "hover:text-ink -ml-1 flex size-7 shrink-0 items-center justify-center self-center",
  title: "font-serif truncate font-semibold tracking-tight",
  page: "text-page",
  compact: "text-item",
  meta: "text-meta text-ink-faint truncate tabular-nums",
  actions: "flex min-w-0 flex-1 items-center justify-end *:min-w-0", // *:min-w-0 讓傳進來的內容縮得下去
};

type PageHeaderProps = {
  title?: string; // 沒給就不顯示標題
  /** 標題旁邊那行小字：幾本、幾篇、在讀幾本 */
  meta?: React.ReactNode;
  /**
   * 頁名是一頁的主角，所以預設就給最大的那一階；
   * 表單與單筆頁的主角在內容裡（書名、單字），頁首只是說明現在在做什麼，用 compact
   */
  size?: "page" | "compact";
  action?: React.ReactNode; // 頁首右側的操作區
  backHref?: string; // 有值就在標題左邊放一個返回箭頭（站內有上一頁時退回去，否則走這個網址）
};

/** 頁首，固定在 PageBody 上方不捲動。與內容的分隔靠留白，不畫線 */
export function PageHeader({ title, meta, size = "page", action, backHref }: PageHeaderProps) {
  // 整條都沒東西就整個收掉
  if (!title && !action && !backHref) return null;

  return (
    <div className={styles.bar}>
      {/* 兩樣都沒有就整格不畫：空的 div 照樣吃掉一個 gap，看起來像左邊多一塊空白 */}
      {(backHref || title) && (
        <div className={styles.heading}>
          {backHref && <BackLink href={backHref} className={styles.back} />}
          {title && <h2 className={`${styles.title} ${styles[size]}`}>{title}</h2>}
          {meta && <span className={styles.meta}>{meta}</span>}
        </div>
      )}
      {/* 按鈕的插槽 */}
      <div className={styles.actions}>{action}</div>
    </div>
  );
}
