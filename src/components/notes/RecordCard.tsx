"use client";

const styles = {
  // 不畫框，改用分隔線隔開：一頁很多則的時候，滿版的框線比內容還搶眼
  card: "flex cursor-pointer items-start gap-3 py-4 hover:bg-gray-50",
  cover: "aspect-2/3 w-14 shrink-0 rounded-sm object-cover shadow ring-1 ring-black/10",
  blank:
    "flex aspect-2/3 w-14 shrink-0 items-center justify-center rounded-sm bg-gray-100 text-[10px] leading-tight text-gray-400",
  body: "flex min-w-0 flex-1 flex-col gap-2",
  head: "flex min-w-0 items-baseline gap-2",
  // 書名是這一則的標題，不是附註，所以比內文大一級也粗一點
  title: "min-w-0 truncate text-base font-semibold",
  // 出處跟在書名後面，同一行但明顯次要
  meta: "shrink-0 text-[11px] text-gray-400",
};

type RecordCardProps = {
  title: string;
  coverUrl: string;
  /** 出處：接在書名後面，例如章節或 Kindle 的引用資訊 */
  meta?: string;
  onClick: () => void;
  children: React.ReactNode;
};

/** 佳句與心得共用的版式：左邊封面，右邊書名與內文 */
export function RecordCard({ title, coverUrl, meta, onClick, children }: RecordCardProps) {
  return (
    <div onClick={onClick} className={styles.card}>
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="" loading="lazy" className={styles.cover} />
      ) : (
        <div className={styles.blank}>{title.slice(0, 2)}</div>
      )}

      <div className={styles.body}>
        <div className={styles.head}>
          <p title={title} className={styles.title}>
            {title}
          </p>
          {meta && (
            <span title={meta} className={styles.meta}>
              — {meta}
            </span>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
