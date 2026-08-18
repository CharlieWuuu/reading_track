"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * 全站共用的動作按鈕與分頁列。
 *
 * 高度、字級、圓角只定在這裡：同一列常同時出現按鈕與分頁列，各寫各的就會參差。
 * 這不是「頁首專用」的樣式，頁首與內文用的是同一套。
 */
export const CONTROL_HEIGHT = "h-8 md:h-9";
const HEIGHT = CONTROL_HEIGHT;
const TEXT = "text-xs font-medium md:text-sm";

const styles = {
  primary: `flex ${HEIGHT} shrink-0 items-center rounded bg-gray-900 px-3 ${TEXT} text-white hover:bg-gray-700 md:px-4`,
  secondary: `flex ${HEIGHT} shrink-0 items-center gap-1 rounded border px-3 ${TEXT} text-gray-600 hover:bg-gray-100`,
  // 只佔自己的寬度，窄螢幕放不下時才在自己裡面橫捲
  // 邊框跟同一排的檢視切換用同一個灰階，兩顆控制項擺在一起才不會一深一淺
  tabs: `flex ${HEIGHT} w-fit max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-gray-300 p-1`,
  tab: `flex h-full shrink-0 items-center rounded px-2.5 ${TEXT} whitespace-nowrap md:px-3`,
  tabActive: "bg-gray-900 text-white",
  tabIdle: "text-gray-500 hover:bg-gray-100",
  menu: "absolute right-0 z-30 mt-1 flex min-w-32 flex-col rounded-lg border bg-white py-1 shadow-lg",
  menuItem: "flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50",
  viewToggle: `inline-flex ${HEIGHT} shrink-0 items-center rounded border border-gray-300 p-0.5`,
  viewButton: "flex h-full items-center rounded px-2",
  viewActive: "bg-gray-900 text-white",
  viewIdle: "text-gray-400 hover:bg-gray-100 hover:text-gray-700",
};

type ActionButtonProps = {
  children: React.ReactNode;
  /** 給了就是連結，沒給就是按鈕 */
  href?: string;
  onClick?: () => void;
  tone?: "primary" | "secondary";
};

/** 主要動作，例如「新增書籍」「編輯」 */
export function ActionButton({ children, href, onClick, tone = "primary" }: ActionButtonProps) {
  const className = tone === "primary" ? styles.primary : styles.secondary;
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

type TabMenu<T extends string> = {
  /** 掛在哪一個分頁底下 */
  for: T;
  items: ReadonlyArray<{ key: string; label: string; Icon?: () => React.ReactElement }>;
  value: string;
  onChange: (next: string) => void;
};

type TabBarProps<T extends string> = {
  items: ReadonlyArray<{ key: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
  /** 某個分頁底下還有幾種看法時，點它就把選單放下來 */
  menu?: TabMenu<T>;
};

/** 分頁列；選中哪一頁由呼叫端決定，這裡只管長相 */
export function TabBar<T extends string>({ items, value, onChange, menu }: TabBarProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 點到別的地方就收起來
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <div className={styles.tabs}>
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              // 有選單的那個分頁：點它只放下選單，選了哪一種看法才真的換頁
              if (menu?.for === item.key) {
                setOpen(!open);
                return;
              }
              onChange(item.key);
              setOpen(false);
            }}
            className={`${styles.tab} ${item.key === value ? styles.tabActive : styles.tabIdle}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {menu && open && (
        <ul className={styles.menu}>
          {menu.items.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => {
                  menu.onChange(item.key);
                  setOpen(false);
                }}
                className={`${styles.menuItem} ${
                  item.key === menu.value ? "font-medium text-gray-900" : "text-gray-500"
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
