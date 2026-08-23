"use client";

import { styles } from "@/components/ui/controls/styles";

type Item<T extends string> = {
  key: T;
  label: string;
  /** 給了就畫圖示，label 退成 aria-label 與 tooltip */
  Icon?: () => React.ReactElement;
};

type SegmentedControlProps<T extends string> = {
  items: ReadonlyArray<Item<T>>;
  value: T;
  onChange: (next: T) => void;
  /** sm 給圖表面板裡的期間切換用，頁首那排維持 md */
  size?: "md" | "sm";
};

/**
 * 一排選項，選中的那個上深色底。
 *
 * 換一批資料（分頁）與換一種畫法（檢視）本來是兩個元件，但結構完全一樣：
 * 外框一個膠囊、裡面幾個項目、選中的上底色。差別只有「項目是文字還是圖示」，
 * 而那由 items 有沒有給 Icon 決定，不需要另一個元件。
 *
 * 有幾個選項就一直佔著多少寬度——放不下的時候要收成選單，那是 SelectMenu。
 */
export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  size = "md",
}: SegmentedControlProps<T>) {
  const box = size === "sm" ? styles.segmentBoxSm : styles.segmentBox;

  return (
    // min-w-0：flex 子項預設 min-width:auto，不加就撐到內容寬，裡面的 overflow-x-auto 永遠捲不動
    <div className="min-w-0">
      <div className={box}>
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            aria-pressed={item.key === value}
            aria-label={item.Icon ? item.label : undefined}
            title={item.Icon ? item.label : undefined}
            className={`${size === "sm" ? styles.segmentSm : styles.segment} ${
              item.key === value ? styles.segmentActive : styles.segmentIdle
            }`}
          >
            {item.Icon ? <item.Icon /> : item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
