import Link from "next/link";
import { BookCover } from "@/components/ui/book-cover";

/** CoverCard 排成的格線：橫向卡較寬，手機一欄、桌機兩欄、寬螢幕三欄 */
export const COVER_CARD_GRID = "grid grid-cols-1 gap-x-8 md:grid-cols-2 xl:grid-cols-3";

const styles = {
  item: "flex min-w-0 gap-4 py-3",
  cover: "w-20 shrink-0 md:w-24", // 寬度給這層，BookCover 用 full 跟著撐
  text: "flex min-w-0 flex-1 flex-col gap-1",
  itemTitle: "font-serif text-item leading-snug font-semibold line-clamp-2",
  label: "text-label text-accent font-medium",
  body: "text-byline text-ink-muted line-clamp-3",
  foot: "text-meta text-ink-faint mt-auto flex items-baseline justify-between gap-3 pt-1",
  caption: "truncate",
  meta: "shrink-0 tabular-nums",
};

export type CoverCardProps = {
  /** 不給就畫成不可點的 div——類型建立頁那種純示意的預覽用 */
  href?: string;
  title: string;
  coverUrl?: string;
  meta?: string | null; // 日期
  label?: string; // 領域
  body?: string; // 摘要
  caption?: string; // 作者・平台・份量
};

/** 紀錄一筆：左封面，右邊標題、領域、摘要，底下作者與日期 */
export function CoverCard({ href, title, coverUrl, meta, label, body, caption }: CoverCardProps) {
  const content = (
    <>
      <div className={styles.cover}>
        <BookCover url={coverUrl ?? ""} title={title} size="full" />
      </div>
      <div className={styles.text}>
        <p className={styles.itemTitle}>{title}</p>
        {label && <span className={styles.label}>{label}</span>}
        {body && <p className={styles.body}>{body}</p>}
        {(caption || meta) && (
          <p className={styles.foot}>
            <span className={styles.caption}>{caption}</span>
            <span className={styles.meta}>{meta}</span>
          </p>
        )}
      </div>
    </>
  );

  if (!href) return <div className={styles.item}>{content}</div>;
  return (
    <Link href={href} className={styles.item}>
      {content}
    </Link>
  );
}
