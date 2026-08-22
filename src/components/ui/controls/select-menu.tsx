"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { styles } from "@/components/ui/controls/styles";
import { useOutsideClick } from "@/hooks/use-outside-click";

export type SelectMenuItem<T extends string> = {
  key: T;
  label: string;
  Icon?: () => React.ReactElement;
};

type SelectMenuProps<T extends string> = {
  items: ReadonlyArray<SelectMenuItem<T>>;
  value: T;
  onChange: (next: T) => void;
  /** 讀螢幕聽到的名字，例如「類型」「顯示方式」；畫面上顯示的是目前選了哪一項 */
  label: string;
  /** 按鈕上只留圖示。選單裡的文字照舊——圖示認不出來的時候就靠那行字 */
  iconOnly?: boolean;
};

/**
 * 一排選項收成一顆按鈕，點了才放下來。
 *
 * 跟 TabBar 的差別是「幾個選項要不要一直佔著寬度」：頁首那一列在手機上放不下
 * 五個分頁，擠出畫面就點不到了（`min-width:auto` 讓它連捲都捲不動）。
 */
export function SelectMenu<T extends string>({
  items,
  value,
  onChange,
  label,
  iconOnly = false,
}: SelectMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useOutsideClick<HTMLDivElement>(open, () => setOpen(false));
  const current = items.find((item) => item.key === value) ?? items[0];
  // 這一組沒有圖示時 iconOnly 不算數：一顆只有箭頭的按鈕說不出自己是什麼
  const showLabel = !iconOnly || !current?.Icon;

  return (
    <div ref={rootRef} className="relative min-w-0 shrink-0">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={showLabel ? styles.secondary : styles.secondaryIcon}
      >
        {current?.Icon && <current.Icon />}
        {showLabel && <span className="truncate">{current?.label}</span>}
        <ChevronDown size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" aria-hidden />
      </button>

      {open && (
        <ul className={styles.menu}>
          {items.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => {
                  onChange(item.key);
                  setOpen(false);
                }}
                className={`${styles.menuItem} ${
                  item.key === value ? "font-medium text-gray-900" : "text-gray-500"
                }`}
              >
                {item.Icon && <item.Icon />}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
