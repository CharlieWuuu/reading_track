"use client";

import Link from "next/link";
import { ReactNode } from "react";

export type FragmentCardProps = {
  /** 點了去哪一頁——跟 onClick 二選一，導覽用途給 href */
  href?: string;
  /** 點了要做什麼（例如開彈窗）——跟 href 二選一，不導覽的用途給 onClick */
  onClick?: () => void;
  /** 有名字就用名字，沒有就用內文開頭——呼叫端決定，這裡不重複那套規則 */
  title: string;
  /** 標題右邊的短標籤：類型（佳句、單字、專欄）或字義，呼叫端決定放哪一種 */
  label?: string;
  /** 標題右邊，label 之外的額外內容：標籤 chips、本數統計 */
  labelExtra?: ReactNode;
  /** 內文本體。跟 title 相同時（標題就是內文開頭）不重複畫 */
  body?: string;
  /** 標題正上方的一行小字：關鍵字的生卒／起訖、單字的發音用這裡 */
  detail?: string;
  /** 底部出處：書名、頁碼之類 */
  meta?: string;
  /** 封面圖，選填——不跟出處的書籍封面連動，使用者自己填的示意圖 */
  coverUrl?: string;
};

/** OverviewLayout 骨架配 FragmentCard 用的共用格線：佳句、單字、關鍵字都吃這個 */
export const FRAGMENT_CARD_GRID = "grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3";

const styles = {
  card: "flex h-full min-w-0 cursor-pointer flex-col gap-2 rounded-surface border border-rule-strong bg-white p-4 hover:bg-gray-50",
  cover: "block h-40 w-full rounded-surface object-cover",
  head: "flex min-w-0 flex-wrap items-end justify-between gap-x-2",
  nameGroup: "flex min-w-0 flex-col",
  name: "min-w-0 font-serif text-item leading-snug font-semibold tracking-tight",
  labelWrap: "flex min-w-0 flex-wrap items-center justify-end gap-1.5",
  label: "text-label text-accent tracking-label min-w-0 font-medium [overflow-wrap:anywhere]",
  detail: "text-[11px] text-gray-400 tabular-nums",
  // 內文可能整段是網址：沒有空白就沒有斷點，break-words 斷不開，要 anywhere
  body: "text-xs leading-relaxed [overflow-wrap:anywhere] text-gray-600 line-clamp-3",
  meta: "truncate text-xs text-gray-400",
};

/**
 * 片段一則一張卡：佳句、單字、專欄、關鍵字都用這一支，同一套視覺語言。
 * 吃的是純資料介面，不綁特定查詢層的形狀——各頁欄位來源不同，呼叫端各自轉成這個介面。
 *
 * href／onClick 二選一：大部分是導覽用的連結，關鍵字是例外（點了開彈窗，
 * 不該把人從正在看的畫面抽走），兩種都是同一張卡、只差點下去發生什麼事。
 */
export function FragmentCard({
  href,
  onClick,
  title,
  label,
  labelExtra,
  body,
  detail,
  meta,
  coverUrl,
}: FragmentCardProps) {
  const showBody = body && body !== title;

  const content = (
    <>
      {coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="" loading="lazy" className={styles.cover} />
      )}
      <div className={styles.head}>
        <span className={styles.nameGroup}>
          {detail && <span className={styles.detail}>{detail}</span>}
          <span className={styles.name}>{title}</span>
        </span>
        {(label || labelExtra) && (
          <span className={styles.labelWrap}>
            {labelExtra}
            {label && <span className={styles.label}>{label}</span>}
          </span>
        )}
      </div>
      {showBody && <p className={styles.body}>{body}</p>}
      {meta && <span className={styles.meta}>{meta}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={styles.card}>
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={styles.card}>
      {content}
    </div>
  );
}
