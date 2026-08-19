"use client";

import { useId, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { splitLines } from "@/types/book";

const styles = {
  wrap: "flex flex-col items-stretch gap-2 md:min-h-0 md:flex-1 md:overflow-y-auto",
  // 跟佳句一樣整份清單只有一個外框；overflow-hidden 讓首尾列的底色收圓角
  list: "flex shrink-0 flex-col divide-y overflow-hidden rounded border",
  row: "flex items-center gap-1 pr-1 focus-within:bg-gray-50",
  // 每列只有一個值，開彈窗編一個字太麻煩，就地打字但拿掉自己的框
  // 藏掉 Chrome 因為 list 屬性畫的下拉箭頭，建議清單照樣會在打字時出現
  input:
    "min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none [&::-webkit-calendar-picker-indicator]:hidden",
  remove: "shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-200 hover:text-red-600",
  // 撐滿寬度：它是清單的一部分，縮在左邊反而像個孤立的按鈕
  add: "flex w-full shrink-0 items-center justify-center gap-1 rounded border border-dashed px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50",
};

type LineListInputProps = {
  /** 一行一筆的原始文字，存進 Sheet 的還是這個格式 */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** 已經用過的值。打字時跳出來讓人挑，免得「京都」被打成「京都府」變成兩個 */
  suggestions?: string[];
  /** 給了就在每一列右邊多一顆筆，點了把這一列的值交出去（例如去編關鍵字主檔） */
  onEditRow?: (value: string) => void;
};

/** 一行一筆的欄位改成一列一個輸入框，比在 textarea 裡數行好編輯 */
export function LineListInput({
  value,
  onChange,
  placeholder,
  suggestions = [],
  onEditRow,
}: LineListInputProps) {
  const listId = useId();
  /**
   * 列數自己記著：一行一筆的字串分不出「沒有任何列」與「一列空白」，
   * 只看 value 的話，空清單按新增會 join 回空字串，畫面就完全沒反應。
   */
  const [lines, setLines] = useState<string[]>(() => (value === "" ? [] : value.split(/\r?\n/)));
  // 換一本書或外面改了值才以 value 為準；剛新增的那列 join 起來還是等於 value，不會被沖掉
  if (lines.join("\n") !== value) {
    setLines(value === "" ? [] : value.split(/\r?\n/));
  }

  const commit = (next: string[]) => {
    setLines(next);
    onChange(next.join("\n"));
  };

  // 這本書已經有的就不用再建議
  const used = new Set(lines.map((line) => line.trim()));
  const options = suggestions.filter((option) => !used.has(option));

  return (
    <div className={styles.wrap}>
      {lines.length > 0 && (
        <div className={styles.list}>
          {lines.map((line, i) => (
            <div key={i} className={styles.row}>
              <input
                value={line}
                onChange={(e) => commit(lines.map((l, j) => (j === i ? e.target.value : l)))}
                placeholder={placeholder}
                list={options.length > 0 ? listId : undefined}
                className={styles.input}
              />
              {onEditRow && line.trim() && (
                <button
                  type="button"
                  aria-label="編輯這一筆的資料"
                  onClick={() => onEditRow(line.trim())}
                  className={styles.remove}
                >
                  <Pencil size={13} strokeWidth={1.5} />
                </button>
              )}
              <button
                type="button"
                aria-label="刪除這一列"
                onClick={() => commit(lines.filter((_, j) => j !== i))}
                className={styles.remove}
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={() => commit([...lines, ""])} className={styles.add}>
        <Plus size={14} strokeWidth={1.5} />
        新增一項
      </button>

      {/* 用原生的 datalist：手機鍵盤上方也會出現建議，不用自己做一套浮動選單 */}
      {options.length > 0 && (
        <datalist id={listId}>
          {options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      )}
    </div>
  );
}

/** 存檔前把使用者留下的空白列清掉，Sheet 裡不要出現空行 */
export function compactLines(value: string): string {
  return splitLines(value).join("\n");
}
