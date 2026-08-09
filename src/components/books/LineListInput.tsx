"use client";

import { useId } from "react";
import { Plus, X } from "lucide-react";
import { splitLines } from "@/types/book";

const styles = {
  wrap: "flex flex-col items-stretch gap-1.5 md:min-h-0 md:flex-1 md:overflow-y-auto",
  list: "flex shrink-0 flex-col gap-1.5",
  row: "flex items-center gap-1",
  input: "min-w-0 flex-1 rounded border px-3 py-1.5 text-sm",
  remove: "shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600",
  add: "flex shrink-0 self-start items-center justify-center gap-1 rounded border border-dashed px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50",
};

type LineListInputProps = {
  /** 一行一筆的原始文字，存進 Sheet 的還是這個格式 */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** 已經用過的值。打字時跳出來讓人挑，免得「京都」被打成「京都府」變成兩個 */
  suggestions?: string[];
};

/** 一行一筆的欄位改成一列一個輸入框，比在 textarea 裡數行好編輯 */
export function LineListInput({
  value,
  onChange,
  placeholder,
  suggestions = [],
}: LineListInputProps) {
  const listId = useId();
  // 編輯中會出現空白列（剛按新增），所以不能用 splitLines 過濾後的結果當畫面來源
  const lines = value === "" ? [] : value.split(/\r?\n/);

  const commit = (next: string[]) => onChange(next.join("\n"));

  // 這本書已經有的就不用再建議
  const used = new Set(lines.map((line) => line.trim()));
  const options = suggestions.filter((option) => !used.has(option));

  return (
    <div className={styles.wrap}>
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

      <button type="button" onClick={() => commit([...lines, ""])} className={styles.add}>
        <Plus size={14} strokeWidth={1.5} />
        新增一列
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
