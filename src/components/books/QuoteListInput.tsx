"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { joinQuotes, parseQuotes, Quote } from "@/types/book";

const styles = {
  wrap: "flex min-h-0 flex-1 flex-col items-stretch gap-1.5 overflow-y-auto",
  list: "flex shrink-0 flex-col gap-2",
  row: "flex items-start gap-1",
  fields: "flex min-w-0 flex-1 flex-col gap-1",
  text: "min-h-16 w-full resize-none rounded border px-3 py-1.5 text-sm",
  note: "min-h-10 w-full resize-none rounded border px-3 py-1.5 text-sm",
  chapter: "w-full rounded border px-3 py-1 text-xs",
  remove: "shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600",
  add: "flex shrink-0 self-start items-center justify-center gap-1 rounded border border-dashed px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50",
};

const EMPTY_QUOTE: Quote = { text: "", chapter: "", note: "" };

type QuoteListInputProps = {
  /** 一行一句、以直線分隔三個欄位的原始文字 */
  value: string;
  onChange: (value: string) => void;
};

/** 佳句一句一組：句子、心得、章節分開填，存回去仍是 Sheet 讀得懂的一行一句 */
export function QuoteListInput({ value, onChange }: QuoteListInputProps) {
  // 剛按「新增」的空白句在文字裡表示不出來，所以列自己留一份狀態
  const [rows, setRows] = useState<Quote[]>(() => parseQuotes(value));
  const [emitted, setEmitted] = useState(value);

  // 外面換了一本書（或重新抓資料）才需要重讀，自己送出去的那份不算
  if (value !== emitted) {
    setEmitted(value);
    setRows(parseQuotes(value));
  }

  function commit(next: Quote[]) {
    setRows(next);
    const text = joinQuotes(next);
    setEmitted(text);
    onChange(text);
  }

  const update = (i: number, patch: Partial<Quote>) =>
    commit(rows.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        {rows.map((row, i) => (
          <div key={i} className={styles.row}>
            <div className={styles.fields}>
              <textarea
                value={row.text}
                onChange={(e) => update(i, { text: e.target.value })}
                placeholder="摘抄的句子"
                className={styles.text}
              />
              <textarea
                value={row.note}
                onChange={(e) => update(i, { note: e.target.value })}
                placeholder="讀到這句時想說的話（可留空）"
                className={styles.note}
              />
              <input
                value={row.chapter}
                onChange={(e) => update(i, { chapter: e.target.value })}
                placeholder="章節（可留空）"
                className={styles.chapter}
              />
            </div>
            <button
              type="button"
              aria-label="刪除這一句"
              onClick={() => commit(rows.filter((_, j) => j !== i))}
              className={styles.remove}
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => commit([...rows, EMPTY_QUOTE])} className={styles.add}>
        <Plus size={14} strokeWidth={1.5} />
        新增一句
      </button>
    </div>
  );
}
