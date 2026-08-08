"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { joinVocabulary, parseVocabulary, VocabularyItem } from "@/types/book";

const styles = {
  wrap: "flex min-h-0 flex-1 flex-col items-stretch gap-1.5 overflow-y-auto",
  list: "flex shrink-0 flex-col gap-2",
  row: "flex items-start gap-1",
  fields: "grid min-w-0 flex-1 grid-cols-1 gap-1 sm:grid-cols-2",
  input: "w-full rounded border px-3 py-1.5 text-sm",
  sentence: "min-h-10 w-full resize-none rounded border px-3 py-1.5 text-sm",
  remove: "shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600",
  add: "flex shrink-0 items-center justify-center gap-1 self-start rounded border border-dashed px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50",
};

const EMPTY_ITEM: VocabularyItem = {
  word: "",
  wordTranslation: "",
  sentence: "",
  sentenceTranslation: "",
  chapter: "",
  language: "",
};

type VocabularyListInputProps = {
  /** 一行一筆、以直線分隔六個欄位的原始文字 */
  value: string;
  onChange: (value: string) => void;
  /** 這本書的語言。新增的單字預設就是它，要不一樣再自己改 */
  bookLanguage: string;
};

/** 單字一個一組：詞與例句各配一個翻譯欄，存回去仍是 Sheet 讀得懂的一行一筆 */
export function VocabularyListInput({ value, onChange, bookLanguage }: VocabularyListInputProps) {
  // 剛按「新增」的空白列在文字裡表示不出來，所以列自己留一份狀態
  const [items, setItems] = useState<VocabularyItem[]>(() => parseVocabulary(value));
  const [emitted, setEmitted] = useState(value);

  // 外面換了一本書（或重新抓資料）才需要重讀，自己送出去的那份不算
  if (value !== emitted) {
    setEmitted(value);
    setItems(parseVocabulary(value));
  }

  function commit(next: VocabularyItem[]) {
    setItems(next);
    const text = joinVocabulary(next);
    setEmitted(text);
    onChange(text);
  }

  const update = (i: number, patch: Partial<VocabularyItem>) =>
    commit(items.map((item, j) => (j === i ? { ...item, ...patch } : item)));

  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        {items.map((item, i) => (
          <div key={i} className={styles.row}>
            <div className={styles.fields}>
              <input
                value={item.word}
                onChange={(e) => update(i, { word: e.target.value })}
                placeholder="詞"
                className={styles.input}
              />
              <input
                value={item.wordTranslation}
                onChange={(e) => update(i, { wordTranslation: e.target.value })}
                placeholder="詞的翻譯"
                className={styles.input}
              />
              <textarea
                value={item.sentence}
                onChange={(e) => update(i, { sentence: e.target.value })}
                placeholder="讀到它的那一句"
                className={styles.sentence}
              />
              <textarea
                value={item.sentenceTranslation}
                onChange={(e) => update(i, { sentenceTranslation: e.target.value })}
                placeholder="例句的翻譯"
                className={styles.sentence}
              />
              <input
                value={item.chapter}
                onChange={(e) => update(i, { chapter: e.target.value })}
                placeholder="章節"
                className={styles.input}
              />
              <input
                value={item.language}
                onChange={(e) => update(i, { language: e.target.value })}
                placeholder={bookLanguage ? `語言（預設 ${bookLanguage}）` : "語言"}
                className={styles.input}
              />
            </div>
            <button
              type="button"
              aria-label="刪除這個單字"
              onClick={() => commit(items.filter((_, j) => j !== i))}
              className={styles.remove}
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => commit([...items, { ...EMPTY_ITEM, language: bookLanguage }])}
        className={styles.add}
      >
        <Plus size={14} strokeWidth={1.5} />
        新增一個
      </button>
    </div>
  );
}
