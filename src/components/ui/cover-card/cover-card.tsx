import Link from "next/link";
import { CoverBand } from "@/components/ui/cover-band/cover-band";

/** CoverCard 排成的格線：欄數跟著寬度長，每欄寬度才不會沒有上限一直被拉開 */
export const COVER_CARD_GRID = "grid grid-cols-2 gap-x-5 md:gap-x-8 xl:grid-cols-3 2xl:grid-cols-4";

const styles = {
  item: "block py-3",
  meta: "text-meta text-ink-faint tabular-nums",
  label: "text-label text-accent tracking-label font-medium",
  itemTitle: "font-serif text-item leading-snug font-semibold tracking-tight",
  byline: "text-byline text-ink-muted",
};

export type CoverCardProps = {
  id: string;
  /** 不給就畫成不可點的 div——類型建立頁那種純示意的預覽用 */
  href?: string;
  title: string;
  coverUrl?: string;
  meta?: string | null;
  label?: string;
  caption?: string;
  /** 底色依這個字串決定色相，同一類就同色。預設用 id（每筆不同色） */
  tintSeed?: string;
};

export function CoverCard({
  id,
  href,
  title,
  coverUrl,
  meta,
  label,
  caption,
  tintSeed,
}: CoverCardProps) {
  const content = (
    <>
      <div className="flex items-baseline justify-between pb-2">
        <span className={styles.meta}>{meta}</span>
        {label && <span className={styles.label}>{label}</span>}
      </div>
      <CoverBand coverUrl={coverUrl} seed={tintSeed ?? id} />
      <p className={`${styles.itemTitle} mt-3 truncate`}>{title}</p>
      {caption && <p className={`${styles.byline} line-clamp-2 pt-1`}>{caption}</p>}
    </>
  );

  if (!href) return <div className={styles.item}>{content}</div>;
  return (
    <Link href={href} className={styles.item}>
      {content}
    </Link>
  );
}
