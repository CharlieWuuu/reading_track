"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { EMPTY_VOCABULARY, VocabularyRow } from "@/types/record";

const styles = {
  wrap: "flex flex-col items-stretch gap-2 md:min-h-0 md:flex-1 md:overflow-y-auto",
  // overflow-hidden 讓第一列與最後一列的 hover 底色跟著外框收圓角
  list: "flex shrink-0 flex-col divide-y overflow-hidden rounded border",
  // 一個一列，點開才編輯：六個欄位攤開來，記十個單字就是六十個輸入框
  item: "flex w-full min-w-0 cursor-pointer items-baseline gap-2 px-3 py-2 text-left hover:bg-gray-50",
  word: "min-w-0 shrink-0 truncate text-sm text-gray-700",
  translation: "min-w-0 flex-1 truncate text-xs text-gray-400",
  add: "flex shrink-0 items-center justify-center gap-1 self-start rounded border border-dashed px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50",
  form: "flex flex-col gap-3",
  pair: "grid grid-cols-1 gap-3 sm:grid-cols-2",
  field: "flex flex-col gap-1",
  label: "text-xs font-medium text-gray-500",
  input: "w-full rounded border px-3 py-1.5 text-sm",
  sentence: "min-h-20 w-full resize-none rounded border px-3 py-1.5 text-sm",
  actions: "flex items-center gap-2 pt-1",
  save: "rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700",
  cancel: "rounded border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50",
  remove: "ml-auto rounded px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-red-600",
};

type VocabularyListInputProps = {
  /** 這本書在單字分頁裡的那幾列 */
  rows: VocabularyRow[];
  onChange: (rows: VocabularyRow[]) => void;
  /** 這本書的語言。新增的單字預設就是它，要不一樣再自己改 */
  bookLanguage: string;
};

/**
 * 單字一個一組：詞與例句各配一個翻譯欄，各自是單字分頁裡的一列。
 *
 * 清單只顯示詞與翻譯，點一列才開彈窗編輯——跟佳句同一種操作。
 */
export function VocabularyListInput({ rows, onChange, bookLanguage }: VocabularyListInputProps) {
  // 編輯中的是「草稿」，按完成才寫回去；取消就整筆丟掉
  const [draft, setDraft] = useState<VocabularyRow | null>(null);

  const newRow = (): VocabularyRow => ({
    id: crypto.randomUUID(),
    bookId: "",
    bookTitle: "",
    ...EMPTY_VOCABULARY,
    language: bookLanguage,
  });

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
              <span className={styles.word}>{row.word || "（空白）"}</span>
              <span className={styles.translation}>{row.wordTranslation}</span>
            </button>
          ))}
        </div>
      )}

      <button type="button" onClick={() => setDraft(newRow())} className={styles.add}>
        <Plus size={14} strokeWidth={1.5} />
        新增一個
      </button>

      {draft && (
        <Dialog title="單字" onClose={() => setDraft(null)}>
          <div className={styles.form}>
            <div className={styles.pair}>
              <div className={styles.field}>
                <label className={styles.label}>詞</label>
                <input
                  autoFocus
                  value={draft.word}
                  onChange={(e) => setDraft({ ...draft, word: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>詞的翻譯</label>
                <input
                  value={draft.wordTranslation}
                  onChange={(e) => setDraft({ ...draft, wordTranslation: e.target.value })}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.pair}>
              <div className={styles.field}>
                <label className={styles.label}>例句（可留空）</label>
                <textarea
                  value={draft.sentence}
                  onChange={(e) => setDraft({ ...draft, sentence: e.target.value })}
                  placeholder="讀到它的那一句"
                  className={styles.sentence}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>例句的翻譯（可留空）</label>
                <textarea
                  value={draft.sentenceTranslation}
                  onChange={(e) => setDraft({ ...draft, sentenceTranslation: e.target.value })}
                  className={styles.sentence}
                />
              </div>
            </div>

            <div className={styles.pair}>
              <div className={styles.field}>
                <label className={styles.label}>章節（可留空）</label>
                <input
                  value={draft.chapter}
                  onChange={(e) => setDraft({ ...draft, chapter: e.target.value })}
                  placeholder="第三章"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>語言</label>
                <input
                  value={draft.language}
                  onChange={(e) => setDraft({ ...draft, language: e.target.value })}
                  placeholder={bookLanguage ? `預設 ${bookLanguage}` : ""}
                  className={styles.input}
                />
              </div>
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
                  刪除這個單字
                </button>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
