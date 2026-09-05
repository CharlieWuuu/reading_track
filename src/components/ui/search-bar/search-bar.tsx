"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { CONTROL_HEIGHT } from "@/components/ui/controls";

const styles = {
  box: `flex ${CONTROL_HEIGHT} min-w-0 flex-1 items-center gap-1.5`,
  input: "min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400",
  clear: "shrink-0 text-gray-400 hover:text-gray-900",
};

/**
 * 頁首那一列的搜尋框，常駐並吃掉整列剩下的寬度。
 *
 * 有一版是收成放大鏡、點了才展開的，換掉了：少按一下比畫面乾淨值錢，
 * 而且收起來時看不出這一頁能不能搜。旁邊的按鈕都 shrink-0，擠的是這一格。
 *
 * 不畫框：常駐之後那個框整列都在，比輸入框本身還搶眼。放大鏡已經說明這是搜尋。
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
