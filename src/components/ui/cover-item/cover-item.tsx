import Link from "next/link";
import { CoverBand } from "@/components/ui/cover-band/cover-band";

const styles = {
  item: "py-3",
  meta: "text-meta text-ink-faint tabular-nums",
  label: "text-label text-accent tracking-label font-medium",
  itemTitle: "font-serif text-item leading-snug font-semibold tracking-tight",
  byline: "text-byline text-ink-muted",
};

export type CoverItemProps = {
  id: string;
  href: string;
  title: string;
  coverUrl?: string;
  meta?: string | null;
  label?: string;
  caption?: string;
  /** 底色依這個字串決定色相，同一類就同色。預設用 id（每筆不同色） */
  tintSeed?: string;
};

export function CoverItem({
  id,
  href,
  title,
  coverUrl,
  meta,
  label,
  caption,
  tintSeed,
}: CoverItemProps) {
  return (
    <div className={styles.item}>
      <div className="flex items-baseline justify-between pb-2">
        <span className={styles.meta}>{meta}</span>
        {label && <span className={styles.label}>{label}</span>}
      </div>
      <CoverBand coverUrl={coverUrl} seed={tintSeed ?? id} />
      <Link href={href} className={`${styles.itemTitle} mt-3 block truncate`}>
        {title}
      </Link>
      {caption && <p className={`${styles.byline} line-clamp-2 pt-1`}>{caption}</p>}
    </div>
  );
}
