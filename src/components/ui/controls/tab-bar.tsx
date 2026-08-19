"use client";

import { useEffect, useRef, useState } from "react";
import { styles } from "@/components/ui/controls/styles";

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
