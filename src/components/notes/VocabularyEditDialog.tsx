"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useCategories } from "@/lib/useCategories";
import { VocabularyEntry } from "@/lib/vocabularyStats";

const styles = {
  form: "flex flex-col gap-3",
  group: "flex flex-col gap-2",
  head: "flex items-center gap-2",
  cover: "aspect-2/3 w-8 shrink-0 rounded-sm object-cover shadow ring-1 ring-black/10",
  blank:
    "flex aspect-2/3 w-8 shrink-0 items-center justify-center rounded-sm bg-gray-100 text-[9px] leading-tight text-gray-400",
  title: "min-w-0 flex-1 truncate text-xs text-gray-500",
  select: "shrink-0 rounded border px-2 py-1 text-xs",
  remove:
    "shrink-0 rounded px-2 py-1 text-[11px] text-gray-400 hover:bg-gray-100 hover:text-red-600",
  removed: "flex items-center gap-2 text-[11px] text-gray-400 line-through",
  undo: "ml-auto rounded px-2 py-0.5 text-[11px] text-gray-500 no-underline hover:bg-gray-100",
  pair: "grid grid-cols-2 gap-2",
  field: "flex flex-col gap-1",
  label: "flex items-baseline gap-2 text-sm font-medium",
  hint: "text-xs font-normal text-gray-400",
  input: "w-full rounded border px-3 py-1.5 text-sm",
  sentence: "min-h-16 w-full resize-none rounded border px-3 py-1.5 text-sm",
  actions: "flex items-center gap-2 pt-1",
  save: "rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50",
  cancel: "rounded border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50",
  error: "text-xs text-red-600",
};

/** 一次要改的一筆：哪本書的第幾行，加上改成什麼 */
export type VocabularyEdit = {
  bookId: string;
  index: number;
  word: string;
  wordTranslation: string;
  sentence: string;
  sentenceTranslation: string;
  chapter: string;
  language: string;
  /** 標記刪除：存檔時把這一行從書的單字欄整行拿掉 */
  deleted?: boolean;
};

type VocabularyEditDialogProps = {
  entry: VocabularyEntry;
  onSave: (edits: VocabularyEdit[]) => Promise<void>;
  onClose: () => void;
};

/** 單字存在各自的書裡，所以在同一個詞底下一本書一組，分別改回去 */
export function VocabularyEditDialog({ entry, onSave, onClose }: VocabularyEditDialogProps) {
  const { categories } = useCategories();
  const [edits, setEdits] = useState<VocabularyEdit[]>(() =>
    entry.encounters.map((e) => ({
      bookId: e.bookId,
      index: e.index,
      word: e.word,
      wordTranslation: e.wordTranslation,
      sentence: e.sentence,
      sentenceTranslation: e.sentenceTranslation,
      chapter: e.chapter,
      language: e.language,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (i: number, patch: Partial<VocabularyEdit>) =>
    setEdits((list) => list.map((edit, j) => (j === i ? { ...edit, ...patch } : edit)));

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await onSave(edits);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
      setSaving(false);
    }
  }

  return (
    <Dialog title={entry.word} showTitle={false} onClose={onClose}>
      <div className={styles.form}>
        {edits.map((edit, i) => {
          const encounter = entry.encounters[i];
          // 主檔的語言選項可能沒有這一筆現在填的值，補進去才不會一開啟就被改掉
          const languages = categories.language.includes(edit.language)
            ? categories.language
            : [edit.language, ...categories.language].filter(Boolean);

          if (edit.deleted) {
            return (
              // 刪掉的先留一列可以反悔，按了儲存才真的寫回去
              <p key={`${edit.bookId}-${edit.index}`} className={styles.removed}>
                {encounter.bookTitle}
                <button
                  type="button"
                  onClick={() => update(i, { deleted: false })}
                  className={styles.undo}
                >
                  復原
                </button>
              </p>
            );
          }

          return (
            <div key={`${edit.bookId}-${edit.index}`} className={styles.group}>
              <div className={styles.head}>
                {encounter.bookCover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={encounter.bookCover} alt="" loading="lazy" className={styles.cover} />
                ) : (
                  <div className={styles.blank}>{encounter.bookTitle.slice(0, 2)}</div>
                )}
                <span className={styles.title}>{encounter.bookTitle}</span>
                <select
                  value={edit.language}
                  onChange={(e) => update(i, { language: e.target.value })}
                  className={styles.select}
                >
                  <option value="">語言</option>
                  {languages.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => update(i, { deleted: true })}
                  className={styles.remove}
                >
                  刪除
                </button>
              </div>

              <div className={styles.pair}>
                <div className={styles.field}>
                  <label className={styles.label}>詞</label>
                  <input
                    value={edit.word}
                    onChange={(e) => update(i, { word: e.target.value })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>詞（翻譯）</label>
                  <input
                    value={edit.wordTranslation}
                    onChange={(e) => update(i, { wordTranslation: e.target.value })}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  例句
                  <span className={styles.hint}>讀到它的那一句</span>
                </label>
                <textarea
                  value={edit.sentence}
                  onChange={(e) => update(i, { sentence: e.target.value })}
                  className={styles.sentence}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>例句（翻譯）</label>
                <textarea
                  value={edit.sentenceTranslation}
                  onChange={(e) => update(i, { sentenceTranslation: e.target.value })}
                  className={styles.sentence}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>章節</label>
                <input
                  value={edit.chapter}
                  onChange={(e) => update(i, { chapter: e.target.value })}
                  className={styles.input}
                />
              </div>
            </div>
          );
        })}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" onClick={handleSave} disabled={saving} className={styles.save}>
            {saving ? "儲存中…" : "儲存"}
          </button>
          <button type="button" onClick={onClose} className={styles.cancel}>
            取消
          </button>
        </div>
      </div>
    </Dialog>
  );
}
