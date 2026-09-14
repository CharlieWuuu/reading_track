import Link from "next/link";
import { imageSrc } from "@/utils/image-key";

/**
 * 右側窄欄那種清單：小標題、數量、幾筆條目、看全部。
 *
 * 書籍概覽與 group 概覽本來各寫一份幾乎逐字相同的 Rail，一邊加了縮圖另一邊沒有，
 * 就長歪了。收成一支，吃的是攤平過的形狀，呼叫端各自轉。
 */

const styles = {
  head: "border-rule-strong flex items-baseline justify-between border-b pb-2",
  label: "text-label text-ink tracking-label",
  meta: "text-meta text-ink-faint tabular-nums",
  item: "border-rule flex items-start gap-2.5 border-b py-[7px]",
  cover: "rounded-surface h-11 w-8 shrink-0 object-cover",
  body: "min-w-0 flex-1",
  title: "font-serif text-item-sm leading-snug font-semibold line-clamp-2",
};

export type RailItem = {
  id: string;
  title: string;
  /** 標題底下那行小字：作者、出處 */
  byline?: string;
  href: string;
  coverUrl?: string;
};

export function OverviewRail({
  label,
  items,
  unit,
  limit,
  /** 總數跟 items.length 不同時給——分頁只載入了前幾筆的情況 */
  total,
}: {
  label: string;
  items: readonly RailItem[];
  unit: string;
  limit?: number;
  total?: number;
}) {
  if (items.length === 0) return null;
  const shown = limit ? items.slice(0, limit) : items;
  const count = total ?? items.length;
  const hidden = count - shown.length;

  return (
    <div>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.meta}>
          {count} {unit}
        </span>
      </div>
      {shown.map((item) => (
        <div key={item.id} className={styles.item}>
          {item.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc(item.coverUrl)} alt="" loading="lazy" className={styles.cover} />
          )}
          <div className={styles.body}>
            <Link href={item.href} className={styles.title}>
              {item.title}
            </Link>
            {item.byline && <div className={styles.meta}>{item.byline}</div>}
          </div>
        </div>
      ))}
      {hidden > 0 && (
        <span className={`${styles.meta} block pt-2`}>
          看全部 {count} {unit} →
        </span>
      )}
    </div>
  );
}
