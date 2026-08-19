"use client";

import { styles } from "@/components/ui/controls/styles";

type ViewToggleProps<T extends string> = {
  items: ReadonlyArray<{ key: T; label: string; Icon: () => React.ReactElement }>;
  value: T;
  onChange: (next: T) => void;
};

/**
 * 檢視切換：同一批資料的不同畫法（表格／書封、卡片／地圖…）。
 * 刻意用 icon 而不是文字——文字分頁代表「換一批資料」，兩者不該長得一樣。
 */
export function ViewToggle<T extends string>({ items, value, onChange }: ViewToggleProps<T>) {
  return (
    <div className={styles.viewToggle}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          aria-pressed={item.key === value}
          aria-label={item.label}
          title={item.label}
          className={`${styles.viewButton} ${
            item.key === value ? styles.viewActive : styles.viewIdle
          }`}
        >
          <item.Icon />
        </button>
      ))}
    </div>
  );
}
