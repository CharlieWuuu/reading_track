"use client";

import { styles } from "@/components/ui/controls/styles";

type TabBarProps<T extends string> = {
  items: ReadonlyArray<{ key: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
  /** sm 給圖表面板裡的期間切換用，頁首那排維持 md */
  size?: "md" | "sm";
};

/** 分頁列；選中哪一頁由呼叫端決定，這裡只管長相 */
export function TabBar<T extends string>({ items, value, onChange, size = "md" }: TabBarProps<T>) {
  const box = size === "sm" ? styles.tabsSm : styles.tabs;
  const item = size === "sm" ? styles.tabSm : styles.tab;

  return (
    // min-w-0：flex 子項預設 min-width:auto，不加就撐到內容寬，裡面的 overflow-x-auto 永遠捲不動
    <div className="min-w-0">
      <div className={box}>
        {items.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`${item} ${tab.key === value ? styles.tabActive : styles.tabIdle}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
