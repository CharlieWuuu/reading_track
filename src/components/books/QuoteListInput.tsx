"use client";

import { Plus, X } from "lucide-react";
import { EMPTY_QUOTE, QuoteRow } from "@/types/record";

const styles = {
  wrap: "flex flex-col items-stretch gap-1.5 md:min-h-0 md:flex-1 md:overflow-y-auto",
  list: "flex shrink-0 flex-col gap-2",
  row: "flex items-start gap-1",
  fields: "flex min-w-0 flex-1 flex-col gap-1",
  text: "min-h-16 w-full resize-none rounded border px-3 py-1.5 text-sm",
  note: "min-h-10 w-full resize-none rounded border px-3 py-1.5 text-sm",
  chapter: "w-full rounded border px-3 py-1 text-xs",
  remove: "shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600",
  add: "flex shrink-0 items-center justify-center gap-1 self-start rounded border border-dashed px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50",
};

type QuoteListInputProps = {
  /** 這本書在佳句分頁裡的那幾列 */
  rows: QuoteRow[];
  onChange: (rows: QuoteRow[]) => void;
};

/** 佳句一句一組：句子、心得、章節分開填，各自是佳句分頁裡的一列 */
export function QuoteListInput({ rows, onChange }: QuoteListInputProps) {
  const update = (i: number, patch: Partial<QuoteRow>) =>
    onChange(rows.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  // 編號在這裡就先發，存檔時才認得出哪一列是哪一列
  const add = () =>
    onChange([...rows, { id: crypto.randomUUID(), bookId: "", bookTitle: "", ...EMPTY_QUOTE }]);

  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        {rows.map((row, i) => (
          <div key={row.id} className={styles.row}>
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
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
              className={styles.remove}
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={add} className={styles.add}>
        <Plus size={14} strokeWidth={1.5} />
        新增一句
      </button>
    </div>
  );
}
