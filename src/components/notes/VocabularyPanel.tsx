"use client";

import { VocabularyEntry } from "@/lib/vocabularyStats";

const styles = {
  cards: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
  card: "flex cursor-pointer flex-col gap-2 rounded-lg border bg-white p-4 hover:border-gray-400",
  head: "flex items-baseline justify-between gap-2",
  headWord: "min-w-0 truncate text-sm font-medium",
  translation: "text-xs text-gray-500",
  count: "shrink-0 text-xs text-gray-400 tabular-nums",
  list: "flex flex-col gap-2",
  sentence: "text-xs leading-relaxed text-gray-600",
  meta: "text-[11px] text-gray-400",
  empty: "py-6 text-center text-xs text-gray-400",
};

type VocabularyPanelProps = {
  entries: VocabularyEntry[];
  onEdit: (entry: VocabularyEntry) => void;
};

/** 單字一個詞一張卡，帶著讀到它的那一句 */
export function VocabularyPanel({ entries, onEdit }: VocabularyPanelProps) {
  if (entries.length === 0) {
    return <div className={styles.empty}>還沒有記下任何單字，先到書籍的「單字」欄記幾個</div>;
  }

  return (
    <div className={styles.cards}>
      {entries.map((entry) => (
        <div key={entry.word} className={styles.card} onClick={() => onEdit(entry)}>
          <div className={styles.head}>
            <span className={styles.headWord}>{entry.word}</span>
            {/* 只遇過一次的不標次數，那是常態，標了只是雜訊 */}
            {entry.encounters.length > 1 && (
              <span className={styles.count}>{entry.encounters.length} 次</span>
            )}
          </div>

          <div className={styles.list}>
            {entry.encounters.map((encounter, i) => (
              <div key={i}>
                {encounter.wordTranslation && (
                  <p className={styles.translation}>{encounter.wordTranslation}</p>
                )}
                {encounter.sentence && <p className={styles.sentence}>{encounter.sentence}</p>}
                {encounter.sentenceTranslation && (
                  <p className={styles.sentence}>{encounter.sentenceTranslation}</p>
                )}
                <p className={styles.meta}>
                  {encounter.bookTitle}
                  {encounter.chapter && `・${encounter.chapter}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
