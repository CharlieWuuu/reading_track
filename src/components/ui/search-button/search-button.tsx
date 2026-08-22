"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { CONTROL_HEIGHT } from "@/components/ui/controls";

const styles = {
  button: `flex ${CONTROL_HEIGHT} shrink-0 items-center justify-center rounded-control border border-gray-300 px-2.5 text-gray-600 hover:bg-gray-50`,
  // 展開時讓輸入框吃掉剩下的寬度，但不把旁邊的分頁與新增擠掉
  box: `flex ${CONTROL_HEIGHT} min-w-0 flex-1 items-center gap-1.5 rounded-control border border-gray-900 px-2.5`,
  input: "min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400",
  clear: "shrink-0 text-gray-400 hover:text-gray-900",
};

/**
 * 收起來只是一個放大鏡，點了才展開成輸入框。
 *
 * 頁首那一列已經有分頁、檢視切換與新增，手機上再擺一個常駐搜尋框就沒位置了；
 * 而搜尋是偶爾才用一次的東西，不該一直佔著寬度。跟旁邊的篩選鈕同一個行為模式。
 */
export function SearchButton({
  value,
  onChange,
  placeholder = "搜尋",
  alwaysOpen = false,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** 那一列有位置給它的時候就一直展開，吃掉中間的寬度 */
  alwaysOpen?: boolean;
}) {
  // 有搜尋詞時一定是展開的：不然使用者會看不出清單為什麼少了一半
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // 打字直接改網址會讓每一個字都重畫一次清單，慢一拍再送出去
  useEffect(() => {
    if (text === value) return;
    const timer = setTimeout(() => onChange(text), 200);
    return () => clearTimeout(timer);
  }, [text, value, onChange]);

  function close() {
    setText("");
    onChange("");
    setOpen(false);
  }

  if (!alwaysOpen && !open && !value) {
    return (
      <button
        type="button"
        aria-label="搜尋"
        onClick={() => {
          setOpen(true);
          // 展開跟聚焦要分兩步：這一刻輸入框還沒被畫出來
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className={styles.button}
      >
        <Search size={16} strokeWidth={1.5} />
      </button>
    );
  }

  return (
    <div className={`${styles.box} ${alwaysOpen ? "" : "md:max-w-64"}`}>
      <Search size={16} strokeWidth={1.5} className="shrink-0 text-gray-400" />
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        // 沒打字就關掉：點開了又不搜，離開時不該留一個空框佔著位置
        onBlur={() => !alwaysOpen && !text && setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && close()}
        placeholder={placeholder}
        className={styles.input}
      />
      {/* 常駐時沒東西可清就不放叉，免得看起來像可以關掉 */}
      {(!alwaysOpen || text) && (
        <button type="button" aria-label="清除搜尋" onClick={close} className={styles.clear}>
          <X size={14} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
