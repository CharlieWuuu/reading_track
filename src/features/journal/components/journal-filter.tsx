"use client";

import { useEffect, useRef, useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import { CONTROL_HEIGHT } from "@/components/ui/controls";

const styles = {
  root: "relative shrink-0",
  // 高度吃全站常數，跟旁邊的新增按鈕、別頁的分頁列站在一起才不會一高一矮
  trigger: `flex ${CONTROL_HEIGHT} items-center gap-1.5 rounded border px-2.5 text-sm whitespace-nowrap hover:bg-gray-50`,
  triggerOn: "border-gray-900 bg-gray-900 text-white hover:bg-gray-700",
  triggerOff: "border-gray-300 text-gray-600",
  // 選單靠右對齊：按鈕本來就在頁首右側，往左展開才不會超出畫面
  panel:
    "absolute right-0 z-50 mt-1 max-h-80 w-48 divide-y overflow-y-auto rounded-lg border bg-white shadow-lg",
  group: "py-1",
  groupLabel: "px-3 pt-1 pb-0.5 text-[11px] text-gray-400",
  item: "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50",
  label: "min-w-0 flex-1 truncate",
  check: "shrink-0 text-gray-900",
  empty: "px-3 py-1.5 text-xs text-gray-400",
};

export type FilterGroup = {
  /** 網址參數的名字，也是這一組的識別 */
  key: string;
  label: string;
  options: string[];
  /** 空字串代表全部 */
  value: string;
};

/**
 * 篩選收在按鈕裡，點了才展開。
 *
 * 頁首本來有一整排類型分頁，加上新增按鈕手機一定擠爆；而且篩選是偶爾才用
 * 一次的東西，不該一直佔著位置。篩選中的時候按鈕直接顯示篩的是什麼。
 */
export function JournalFilter({
  groups,
  onChange,
}: {
  groups: FilterGroup[];
  onChange: (key: string, next: string) => void;
}) {
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

  function pick(key: string, next: string) {
    onChange(key, next);
    setOpen(false);
  }

  const active = groups.filter((g) => g.value);

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`${styles.trigger} ${active.length > 0 ? styles.triggerOn : styles.triggerOff}`}
      >
        <SlidersHorizontal size={14} strokeWidth={1.5} aria-hidden />
        <span className="hidden sm:inline">
          {active.length > 0 ? active.map((g) => g.value).join("・") : "篩選"}
        </span>
      </button>

      {open && (
        <div className={styles.panel}>
          {groups.map((group) => (
            <div key={group.key} className={styles.group}>
              <p className={styles.groupLabel}>{group.label}</p>

              {group.options.length === 0 ? (
                <p className={styles.empty}>還沒有任何{group.label}</p>
              ) : (
                <>
                  <button type="button" onClick={() => pick(group.key, "")} className={styles.item}>
                    <span className={styles.label}>全部</span>
                    {!group.value && <Check size={14} strokeWidth={2} className={styles.check} />}
                  </button>
                  {group.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => pick(group.key, option)}
                      className={styles.item}
                    >
                      <span className={styles.label}>{option}</span>
                      {group.value === option && (
                        <Check size={14} strokeWidth={2} className={styles.check} />
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
