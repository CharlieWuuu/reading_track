"use client";

import { useState } from "react";
import { FormActions } from "@/components/ui/FormActions";
import { useCategories } from "@/lib/useCategories";
import { VocabularyEncounter, VocabularyEntry } from "@/lib/vocabularyStats";
import { VocabularyRow } from "@/types/record";

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
  label: "text-sm font-medium",
  input: "w-full rounded border px-3 py-1.5 text-sm",
  sentence: "min-h-28 w-full resize-none rounded border px-3 py-1.5 text-sm",
  actions: "flex items-center gap-2 pt-1",
  save: "rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50",
  cancel: "rounded border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50",
  error: "text-xs text-red-600",
};

/** 一次要改的一筆紀錄，加上「這一列要不要留」 */
export type VocabularyEdit = VocabularyRow & {
  /** 標記刪除：存檔時把這一列從單字分頁拿掉 */
  deleted?: boolean;
};

/** 從畫面用的相遇取回那一列紀錄本身：封面是顯示用的，不屬於紀錄 */
function toRow(encounter: VocabularyEncounter): VocabularyRow {
  const { bookCover, ...row } = encounter;
  void bookCover;
  return row;
}

type VocabularyFormProps = {
  entry: VocabularyEntry;
  onSave: (edits: VocabularyEdit[]) => Promise<void>;
  /** 存完或按取消之後要去哪 */
  onDone: () => void;
};

/** 單字存在各自的書裡，所以在同一個詞底下一本書一組，分別改回去 */
export function VocabularyForm({ entry, onSave, onDone }: VocabularyFormProps) {
  const { categories } = useCategories();
  const [edits, setEdits] = useState<VocabularyEdit[]>(() =>
    // bookCover 只是顯示用的，不屬於那一列紀錄，寫回去時不該跟著跑
    entry.encounters.map((encounter) => toRow(encounter)),
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
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
      setSaving(false);
    }
  }

  return (
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
            <p key={edit.id} className={styles.removed}>
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
          <div key={edit.id} className={styles.group}>
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
                <label className={styles.label}>讀音</label>
                <input
                  value={edit.pronunciation}
                  onChange={(e) => update(i, { pronunciation: e.target.value })}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.pair}>
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
              <label className={styles.label}>例句</label>
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

      <FormActions onSave={handleSave} saving={saving} onCancel={onDone} error={error} />
    </div>
  );
}
