/**
 * 右側窄欄那種清單：小標題、數量、幾筆條目、看全部。
 *
 * 一筆怎麼畫由呼叫端給（renderItem），跟中間的格線同一支——照那一筆類型的卡片樣式。
 *
 * 同一份內容畫兩個地方：桌機在右側窄欄，一列一筆；窄螢幕沒有右欄，插進主欄頭條底下，
 * 那裡跟月份格線一樣寬，就照格線排（gridClassName），不然一筆佔滿整個寬度。
 */

const styles = {
  head: "border-rule-strong flex items-baseline justify-between border-b pb-2",
  label: "text-label text-ink",
  meta: "text-meta text-ink-faint tabular-nums",
};

type RailItem = { id: string };

export function OverviewRail<T extends RailItem>({
  label,
  items,
  unit,
  limit,
  /** 總數跟 items.length 不同時給——分頁只載入了前幾筆的情況 */
  total,
  renderItem,
  gridClassName,
  itemClassName,
}: {
  label: string;
  items: readonly T[];
  renderItem: (item: T) => React.ReactNode;
  gridClassName: string; // 窄螢幕插在主欄時的排法，跟月份格線同一個
  itemClassName?: (item: T) => string; // 一筆佔多寬，混排時用得到
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
      <div className={`${gridClassName} pt-3 lg:flex lg:flex-col lg:gap-4`}>
        {shown.map((item) => (
          <div key={item.id} className={itemClassName?.(item)}>
            {renderItem(item)}
          </div>
        ))}
      </div>
      {hidden > 0 && (
        <span className={`${styles.meta} block pt-2`}>
          看全部 {count} {unit} →
        </span>
      )}
    </div>
  );
}
