"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { CONTROL_HEIGHT } from "@/components/ui/controls";

const styles = {
  // 跟旁邊按鈕共用剩下的寬度；圖示貼右邊，展開時輸入框往左長出來
  box: `flex ${CONTROL_HEIGHT} min-w-0 flex-1 items-center justify-end gap-1.5`,
  trigger:
    "text-ink-muted hover:text-ink shrink-0 rounded-control border border-transparent px-2 py-1",
  // 展開時吃掉 box 剩下的寬度（flex-1），收起時歸零；輸入框始終在 DOM 裡，focus 不會被打斷
  inputWrap: "min-w-0 overflow-hidden transition-[flex-grow,width] duration-200 ease-out",
  // 底線取代原本的無框透明：輸入中要看得出這是一格，不是整列都在搶注意力
  input:
    "border-ink-faint min-w-0 border-b bg-transparent px-0.5 text-sm outline-none placeholder:text-gray-400 focus:border-ink",
  clear: "shrink-0 text-gray-400 hover:text-gray-900",
};

/**
 * 頁首那一列的搜尋框。平常收成一顆放大鏡圖示，點了才展開輸入框——
 * 麵包屑與統計數字加進頁首後空間變擠，常駐的輸入框太搶位置。
 *
 * 展開靠 width 動畫，不是條件渲染：輸入框始終在 DOM 裡，收合時保留已輸入的字，
 * 再次展開不會像重新打開一個新的搜尋。
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
  // 網址帶著搜尋字就是展開的：分享連結或上一頁回來時，看得出這頁正在搜什麼。
  // 使用者手動點開的狀態疊在上面，兩者都成立才收得起來
  const [manuallyOpen, setManuallyOpen] = useState(false);
  const open = manuallyOpen || Boolean(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // 打字直接改網址會讓每一個字都重畫一次清單，慢一拍再送出去
  useEffect(() => {
    if (text === value) return;
    const timer = setTimeout(() => onChange(text), 200);
    return () => clearTimeout(timer);
  }, [text, value, onChange]);

  function expand() {
    setManuallyOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function clear() {
    setText("");
    onChange("");
    inputRef.current?.focus();
  }

  function collapse() {
    if (text) return; // 有字就不收，收起來看不出這頁正在搜什麼
    setManuallyOpen(false);
  }

  // mousedown 比 input 的 blur 早觸發：用它讀「點之前」的展開狀態，
  // 不然 click 事件排在 blur 後面，這裡看到的 open 已經被 blur 收掉了，
  // 判斷結果永遠是「還沒開」，於是又展開一次，變成收起又立刻彈回來
  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    if (open && !text) {
      setManuallyOpen(false);
      return;
    }
    expand();
  }

  return (
    <div className={styles.box}>
      <div
        className={styles.inputWrap}
        style={open ? { flexGrow: 1, width: "auto" } : { flexGrow: 0, width: "0" }}
      >
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && clear()}
          onBlur={collapse}
          placeholder={placeholder}
          aria-label={placeholder}
          className={`${styles.input} w-full`}
        />
      </div>
      {/* 沒東西可清就不放叉，免得那顆看起來像可以關掉搜尋框 */}
      {text && (
        <button type="button" aria-label="清除搜尋" onClick={clear} className={styles.clear}>
          <X size={14} strokeWidth={1.5} />
        </button>
      )}
      <button
        type="button"
        aria-label={placeholder}
        title={placeholder}
        onMouseDown={toggle}
        className={styles.trigger}
      >
        <Search size={16} strokeWidth={1.5} aria-hidden />
      </button>
    </div>
  );
}
