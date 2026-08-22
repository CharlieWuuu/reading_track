"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { CONTROL_HEIGHT } from "@/components/ui/controls";

const styles = {
  box: `flex ${CONTROL_HEIGHT} min-w-0 flex-1 items-center gap-1.5 rounded-control border border-rule-strong px-2.5`,
  input: "min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400",
  clear: "shrink-0 text-gray-400 hover:text-gray-900",
};

/**
 * 頁首那一列的搜尋框，吃掉標題與右邊控制項之間的寬度。
 *
 * 原本收成一顆放大鏡，點了才展開——那是因為旁邊還排著五個分頁；分頁收進選單
 * 之後那一列空了出來，常駐比「點一下才能打字」少一步。
 */
export function SearchBar({
  value,
  onChange,
  placeholder = "搜尋",
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(value);

  // 打字直接改網址會讓每一個字都重畫一次清單，慢一拍再送出去
  useEffect(() => {
    if (text === value) return;
    const timer = setTimeout(() => onChange(text), 200);
    return () => clearTimeout(timer);
  }, [text, value, onChange]);

  const inputRef = useRef<HTMLInputElement>(null);

  function clear() {
    setText("");
    onChange("");
    inputRef.current?.focus();
  }

  return (
    <div className={styles.box}>
      <Search size={16} strokeWidth={1.5} className="shrink-0 text-gray-400" aria-hidden />
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && clear()}
        placeholder={placeholder}
        aria-label={placeholder}
        className={styles.input}
      />
      {/* 沒東西可清就不放叉，免得那顆看起來像可以關掉搜尋框 */}
      {text && (
        <button type="button" aria-label="清除搜尋" onClick={clear} className={styles.clear}>
          <X size={14} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
