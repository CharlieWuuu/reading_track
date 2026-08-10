"use client";

import { useState } from "react";
import { Plus, Quote as QuoteIcon } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { EMPTY_QUOTE, QuoteRow } from "@/types/record";

const styles = {
  wrap: "flex flex-col items-stretch gap-2 md:min-h-0 md:flex-1 md:overflow-y-auto",
  // overflow-hidden 讓第一列與最後一列的 hover 底色跟著外框收圓角
  list: "flex shrink-0 flex-col divide-y overflow-hidden rounded border",
  // 一句一列，點開才編輯：抄了二十句時，攤開的欄位會把整張表單淹掉
  item: "flex w-full min-w-0 cursor-pointer items-start gap-2 px-3 py-2 text-left hover:bg-gray-50",
  mark: "mt-0.5 shrink-0 rotate-180 text-gray-300",
  // 一列一行：清單只負責讓人找到那一句，內容進彈窗才看得完整
  itemText: "min-w-0 flex-1 truncate text-sm text-gray-700",
  add: "flex shrink-0 items-center justify-center gap-1 self-start rounded border border-dashed px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50",
  form: "flex flex-col gap-3",
  field: "flex flex-col gap-1",
  label: "text-xs font-medium text-gray-500",
  text: "min-h-28 w-full resize-none rounded border px-3 py-1.5 text-sm",
  note: "min-h-20 w-full resize-none rounded border px-3 py-1.5 text-sm",
  input: "w-full rounded border px-3 py-1.5 text-sm",
  actions: "flex items-center gap-2 pt-1",
  save: "rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50",
  cancel: "rounded border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50",
  remove: "ml-auto rounded px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-red-600",
};

type QuoteListInputProps = {
  /** 這本書在佳句分頁裡的那幾列 */
  rows: QuoteRow[];
  onChange: (rows: QuoteRow[]) => void;
};

function newRow(): QuoteRow {
  return { id: crypto.randomUUID(), bookId: "", bookTitle: "", ...EMPTY_QUOTE };
}

/**
 * 佳句一句一組：句子、心得、章節分開填，各自是佳句分頁裡的一列。
 *
 * 清單只顯示句子，點一列才開彈窗編輯那三欄——跟筆記頁的佳句是同一種操作。
 */
export function QuoteListInput({ rows, onChange }: QuoteListInputProps) {
  // 編輯中的是「草稿」，按儲存才寫回去；取消就整筆丟掉
  const [draft, setDraft] = useState<QuoteRow | null>(null);

  function saveDraft() {
    if (!draft) return;
    const exists = rows.some((row) => row.id === draft.id);
    onChange(exists ? rows.map((row) => (row.id === draft.id ? draft : row)) : [...rows, draft]);
    setDraft(null);
  }

  function removeDraft() {
    if (!draft) return;
    onChange(rows.filter((row) => row.id !== draft.id));
    setDraft(null);
  }

  return (
    <div className={styles.wrap}>
      {rows.length > 0 && (
        <div className={styles.list}>
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setDraft(row)}
              className={styles.item}
            >
              <QuoteIcon size={13} strokeWidth={1.5} className={styles.mark} aria-hidden />
              <span className={styles.itemText}>{row.text || "（空白）"}</span>
            </button>
          ))}
        </div>
      )}

      <button type="button" onClick={() => setDraft(newRow())} className={styles.add}>
        <Plus size={14} strokeWidth={1.5} />
        新增一句
      </button>

      {draft && (
        <Dialog title="佳句" onClose={() => setDraft(null)}>
          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>句子</label>
              <textarea
                autoFocus
                value={draft.text}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                className={styles.text}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>心得（可留空）</label>
              <textarea
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                placeholder="讀到這句時想說的話"
                className={styles.note}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>章節（可留空）</label>
              <input
                value={draft.chapter}
                onChange={(e) => setDraft({ ...draft, chapter: e.target.value })}
                placeholder="第三章"
                className={styles.input}
              />
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={saveDraft} className={styles.save}>
                完成
              </button>
              <button type="button" onClick={() => setDraft(null)} className={styles.cancel}>
                取消
              </button>
              {rows.some((row) => row.id === draft.id) && (
                <button type="button" onClick={removeDraft} className={styles.remove}>
                  刪除這一句
                </button>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
