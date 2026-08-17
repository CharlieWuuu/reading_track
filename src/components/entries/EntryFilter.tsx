"use client";

import { useEffect, useRef, useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";

const styles = {
  root: "relative shrink-0",
  trigger:
    "flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-sm whitespace-nowrap hover:bg-gray-50",
  triggerOn: "border-gray-900 bg-gray-900 text-white hover:bg-gray-700",
  triggerOff: "border-gray-300 text-gray-600",
  // 選單靠右對齊：按鈕本來就在頁首右側，往左展開才不會超出畫面
  panel:
    "absolute right-0 z-50 mt-1 max-h-72 w-44 overflow-y-auto rounded-lg border bg-white py-1 shadow-lg",
  item: "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50",
  label: "min-w-0 flex-1 truncate",
  check: "shrink-0 text-gray-900",
  empty: "px-3 py-2 text-xs text-gray-400",
};

/**
 * 篩選收在按鈕裡，點了才展開。
 *
 * 頁首已經有類型分頁與新增按鈕，篩選再攤成一整列的話手機一定擠爆；
 * 而且它是「偶爾才用一次」的東西，不該一直佔著位置。
 */
export function EntryFilter({
  label,
  options,
  value,
  onChange,
}: {
  /** 這一組在篩什麼，例如「領域」 */
  label: string;
  options: string[];
  /** 空字串代表全部 */
  value: string;
  onChange: (next: string) => void;
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

  function pick(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`${styles.trigger} ${value ? styles.triggerOn : styles.triggerOff}`}
      >
        <SlidersHorizontal size={14} strokeWidth={1.5} aria-hidden />
        {/* 篩選中就直接顯示篩的是什麼，不用點開才想得起來 */}
        <span className="hidden sm:inline">{value || "篩選"}</span>
      </button>

      {open && (
        <div className={styles.panel}>
          {options.length === 0 ? (
            <p className={styles.empty}>還沒有任何{label}</p>
          ) : (
            <>
              <button type="button" onClick={() => pick("")} className={styles.item}>
                <span className={styles.label}>全部{label}</span>
                {!value && <Check size={14} strokeWidth={2} className={styles.check} />}
              </button>
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => pick(option)}
                  className={styles.item}
                >
                  <span className={styles.label}>{option}</span>
                  {value === option && <Check size={14} strokeWidth={2} className={styles.check} />}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
