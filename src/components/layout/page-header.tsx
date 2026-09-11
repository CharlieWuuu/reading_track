import Link from "next/link";
import { BackLink } from "./back-link";

const styles = {
  // 頁首不捲動；跟設計稿一致，底下畫一條線把頁首跟內容列表分開
  bar: "border-ink flex shrink-0 flex-wrap items-baseline justify-between gap-2 border-b pb-1 md:gap-3",
  heading: "flex min-w-0 items-baseline gap-2",
  back: "hover:text-ink -ml-1 flex size-7 shrink-0 items-center justify-center self-center",
  // 跟 meta 那行數字同一個字級：標題才是這一列的主角，麵包屑只是說明現在在哪
  parent: "text-meta text-ink-muted truncate",
  parentLink: "text-meta text-ink-muted truncate hover:text-ink hover:underline",
  divider: "text-ink-faint",
  title: "font-serif truncate font-semibold tracking-tight",
  page: "text-page",
  compact: "text-item",
  // 標題跟這行數字不算同一組資訊，間距要比麵包屑／標題那組鬆
  meta: "text-meta text-ink-faint truncate tabular-nums ml-2",
  actions: "flex min-w-0 flex-1 items-center justify-end *:min-w-0", // *:min-w-0 讓傳進來的內容縮得下去
};

/** 麵包屑一段：純文字沒有 href 就不能點，有給就是連到那一層 */
type Crumb = { label: string; href?: string };

type PageHeaderProps = {
  title?: string; // 沒給就不顯示標題
  /** 標題前面的麵包屑：一段是「紀錄 / 書籍」的「紀錄」，多段就是「紀錄 / 書籍 / 詳情」的前兩段——分隔線統一由這裡插入，呼叫端不用自己拼字元。字串就是不能點的純文字，要能點傳 Crumb 帶 href */
  parent?: string | Crumb | (string | Crumb)[];
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

/** 頁首，固定在 PageBody 上方不捲動。底下一條線分隔內容，跟著設計稿 */
export function PageHeader({
  title,
  parent,
  meta,
  size = "page",
  action,
  backHref,
}: PageHeaderProps) {
  // 整條都沒東西就整個收掉
  if (!title && !action && !backHref) return null;

  return (
    <div className={styles.bar}>
      {/* 兩樣都沒有就整格不畫：空的 div 照樣吃掉一個 gap，看起來像左邊多一塊空白 */}
      {(backHref || title) && (
        <div className={styles.heading}>
          {backHref && <BackLink href={backHref} className={styles.back} />}
          {parent &&
            (Array.isArray(parent) ? parent : [parent]).map((segment, i) => {
              const crumb: Crumb = typeof segment === "string" ? { label: segment } : segment;
              return (
                <span key={i} className="flex items-baseline gap-2">
                  {crumb.href ? (
                    <Link href={crumb.href} className={styles.parentLink}>
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={styles.parent}>{crumb.label}</span>
                  )}
                  <span className={styles.divider}>/</span>
                </span>
              );
            })}
          {title && <h2 className={`${styles.title} ${styles[size]}`}>{title}</h2>}
          {meta && <span className={styles.meta}>{meta}</span>}
        </div>
      )}
      {/* 按鈕的插槽 */}
      <div className={styles.actions}>{action}</div>
    </div>
  );
}
