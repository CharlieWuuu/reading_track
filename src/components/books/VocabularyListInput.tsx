"use client";

import { Plus, X } from "lucide-react";
import { EMPTY_VOCABULARY, VocabularyRow } from "@/types/record";

const styles = {
  wrap: "flex flex-col items-stretch gap-1.5 md:min-h-0 md:flex-1 md:overflow-y-auto",
  list: "flex shrink-0 flex-col gap-2",
  row: "flex items-start gap-1",
  fields: "grid min-w-0 flex-1 grid-cols-1 gap-1 sm:grid-cols-2",
  input: "w-full rounded border px-3 py-1.5 text-sm",
  sentence: "min-h-10 w-full resize-none rounded border px-3 py-1.5 text-sm",
  remove: "shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600",
  add: "flex shrink-0 items-center justify-center gap-1 self-start rounded border border-dashed px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50",
};

type VocabularyListInputProps = {
  /** 這本書在單字分頁裡的那幾列 */
  rows: VocabularyRow[];
  onChange: (rows: VocabularyRow[]) => void;
  /** 這本書的語言。新增的單字預設就是它，要不一樣再自己改 */
  bookLanguage: string;
};

/** 單字一個一組：詞與例句各配一個翻譯欄，各自是單字分頁裡的一列 */
export function VocabularyListInput({ rows, onChange, bookLanguage }: VocabularyListInputProps) {
  const update = (i: number, patch: Partial<VocabularyRow>) =>
    onChange(rows.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  // 編號在這裡就先發，存檔時才認得出哪一列是哪一列
  const add = () =>
    onChange([
      ...rows,
      {
        id: crypto.randomUUID(),
        bookId: "",
        bookTitle: "",
        ...EMPTY_VOCABULARY,
        language: bookLanguage,
      },
    ]);

  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        {rows.map((row, i) => (
          <div key={row.id} className={styles.row}>
            <div className={styles.fields}>
              <input
                value={row.word}
                onChange={(e) => update(i, { word: e.target.value })}
                placeholder="詞"
                className={styles.input}
              />
              <input
                value={row.wordTranslation}
                onChange={(e) => update(i, { wordTranslation: e.target.value })}
                placeholder="詞的翻譯"
                className={styles.input}
              />
              <textarea
                value={row.sentence}
                onChange={(e) => update(i, { sentence: e.target.value })}
                placeholder="讀到它的那一句"
                className={styles.sentence}
              />
              <textarea
                value={row.sentenceTranslation}
                onChange={(e) => update(i, { sentenceTranslation: e.target.value })}
                placeholder="例句的翻譯"
                className={styles.sentence}
              />
              <input
                value={row.chapter}
                onChange={(e) => update(i, { chapter: e.target.value })}
                placeholder="章節"
                className={styles.input}
              />
              <input
                value={row.language}
                onChange={(e) => update(i, { language: e.target.value })}
                placeholder={bookLanguage ? `語言（預設 ${bookLanguage}）` : "語言"}
                className={styles.input}
              />
            </div>
            <button
              type="button"
              aria-label="刪除這個單字"
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
        新增一個
      </button>
    </div>
  );
}
