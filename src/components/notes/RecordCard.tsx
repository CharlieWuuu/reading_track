"use client";

import { BookCover } from "@/components/ui/BookCover";

const styles = {
  // 不畫框，改用分隔線隔開：一頁很多則的時候，滿版的框線比內容還搶眼
  // 左右各留一點：外層是捲動容器（overflow-y 一旦不是 visible，橫向也會裁），
  // 封面貼著邊的話光暈與外框線會被切掉一條
  card: "flex cursor-pointer items-start gap-3 px-1 py-3 hover:bg-gray-50 md:py-4",
  body: "flex min-w-0 flex-1 flex-col gap-2",
  head: "flex min-w-0 items-baseline gap-2",
  // 書名是這一則的標題，不是附註，所以比內文大一級也粗一點
  title: "min-w-0 truncate text-base font-semibold",
  // 出處跟在書名後面，同一行但明顯次要
  meta: "shrink-0 text-[11px] text-gray-400",
};

type RecordCardProps = {
  /** 封面對不到書時，用它的前兩個字當替代圖 */
  title: string;
  /** 佳句已經看得出是哪一本（封面就在旁邊），書名反而搶走視線 */
  showTitle?: boolean;
  coverUrl: string;
  /** 出處：接在書名後面，例如章節或 Kindle 的引用資訊 */
  meta?: string;
  onClick: () => void;
  children: React.ReactNode;
};

/** 佳句與心得共用的版式：左邊封面，右邊書名與內文 */
export function RecordCard({
  title,
  showTitle = true,
  coverUrl,
  meta,
  onClick,
  children,
}: RecordCardProps) {
  return (
    <div onClick={onClick} className={styles.card}>
      <BookCover url={coverUrl} title={title} size="lg" />

      <div className={styles.body}>
        {(showTitle || meta) && (
          <div className={styles.head}>
            {showTitle && (
              <p title={title} className={styles.title}>
                {title}
              </p>
            )}
            {meta && (
              <span title={meta} className={styles.meta}>
                {showTitle ? `— ${meta}` : meta}
              </span>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
