"use client";

import { Plus, X } from "lucide-react";
import { splitLines } from "@/types/book";

const styles = {
  wrap: "flex min-h-0 flex-1 flex-col items-stretch gap-1.5 overflow-y-auto",
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
};

/** 一行一筆的欄位改成一列一個輸入框，比在 textarea 裡數行好編輯 */
export function LineListInput({ value, onChange, placeholder }: LineListInputProps) {
  // 編輯中會出現空白列（剛按新增），所以不能用 splitLines 過濾後的結果當畫面來源
  const lines = value === "" ? [] : value.split(/\r?\n/);

  const commit = (next: string[]) => onChange(next.join("\n"));

  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        {lines.map((line, i) => (
          <div key={i} className={styles.row}>
            <input
              value={line}
              onChange={(e) => commit(lines.map((l, j) => (j === i ? e.target.value : l)))}
              placeholder={placeholder}
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
    </div>
  );
}

/** 存檔前把使用者留下的空白列清掉，Sheet 裡不要出現空行 */
export function compactLines(value: string): string {
  return splitLines(value).join("\n");
}
