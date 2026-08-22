"use client";

import { styles } from "@/components/ui/controls/styles";

type TabBarProps<T extends string> = {
  items: ReadonlyArray<{ key: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
};

/** 分頁列；選中哪一頁由呼叫端決定，這裡只管長相 */
export function TabBar<T extends string>({ items, value, onChange }: TabBarProps<T>) {
  return (
    // min-w-0：flex 子項預設 min-width:auto，不加就撐到內容寬，裡面的 overflow-x-auto 永遠捲不動
    <div className="min-w-0">
      <div className={styles.tabs}>
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`${styles.tab} ${item.key === value ? styles.tabActive : styles.tabIdle}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
