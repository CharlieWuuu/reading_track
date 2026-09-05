"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { CONTROL_HEIGHT } from "@/components/ui/controls";

const styles = {
  box: `flex ${CONTROL_HEIGHT} min-w-0 flex-1 items-center gap-1.5 rounded-control border border-rule-strong px-2.5`,
  collapsed: `flex ${CONTROL_HEIGHT} aspect-square shrink-0 items-center justify-center rounded-control text-gray-400 hover:bg-gray-100 hover:text-gray-900`,
  input: "min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400",
  clear: "shrink-0 text-gray-400 hover:text-gray-900",
};

/**
 * 頁首那一列的搜尋框。平常收成一顆放大鏡，點了才展開。
 *
 * 中間有一版是常駐的（分頁收進選單後那一列空了），但一個永遠空著的輸入框
 * 佔掉整列還是太吵——搜尋是偶爾才用的動作，值得多按一下換畫面乾淨。
 * 有字的時候不收回去，不然看不出清單正被過濾。
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
  const [open, setOpen] = useState(Boolean(value));

  function clear() {
    setText("");
    onChange("");
    inputRef.current?.focus();
  }

  if (!open && !text) {
    return (
      <button
        type="button"
        aria-label={placeholder}
        onClick={() => {
          setOpen(true);
          // 這一輪還沒畫出 input，等下一輪再對焦
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className={styles.collapsed}
      >
        <Search size={16} strokeWidth={1.5} aria-hidden />
      </button>
    );
  }

  return (
    <div className={styles.box}>
      <Search size={16} strokeWidth={1.5} className="shrink-0 text-gray-400" aria-hidden />
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && clear()}
        onBlur={() => !text && setOpen(false)}
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
