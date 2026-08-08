"use client";

import { VocabularyEntry } from "@/lib/vocabularyStats";

const styles = {
  cards: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
  card: "relative flex cursor-pointer flex-col gap-2 rounded-lg border bg-white p-4 hover:border-gray-400",
  head: "flex items-baseline justify-between gap-2 pr-12",
  headWord: "min-w-0 truncate text-sm font-medium",
  translation: "text-xs text-gray-500",
  count: "shrink-0 text-xs text-gray-400 tabular-nums",
  list: "flex flex-col gap-2",
  entry: "flex flex-col gap-0.5",
  covers: "absolute top-3 right-3 flex gap-1",
  cover: "aspect-2/3 w-4 rounded-[2px] object-cover shadow-sm ring-1 ring-black/10",
  blank:
    "flex aspect-2/3 w-4 items-center justify-center rounded-[2px] bg-gray-100 text-[7px] leading-none text-gray-400",
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
          {/* 書名不寫出來，右上角一張小封面就夠認出是哪一本 */}
          <div className={styles.covers}>
            {entry.encounters.map((encounter, i) =>
              encounter.bookCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={encounter.bookCover}
                  alt=""
                  loading="lazy"
                  title={encounter.bookTitle}
                  className={styles.cover}
                />
              ) : (
                <div key={i} className={styles.blank} title={encounter.bookTitle}>
                  {encounter.bookTitle.slice(0, 1)}
                </div>
              ),
            )}
          </div>

          <div className={styles.head}>
            <span className={styles.headWord}>{entry.word}</span>
            {/* 只遇過一次的不標次數，那是常態，標了只是雜訊 */}
            {entry.encounters.length > 1 && (
              <span className={styles.count}>{entry.encounters.length} 次</span>
            )}
          </div>

          <div className={styles.list}>
            {entry.encounters.map((encounter, i) => (
              <div key={i} className={styles.entry}>
                {encounter.wordTranslation && (
                  <p className={styles.translation}>{encounter.wordTranslation}</p>
                )}
                {encounter.sentence && <p className={styles.sentence}>{encounter.sentence}</p>}
                {encounter.sentenceTranslation && (
                  <p className={styles.sentence}>{encounter.sentenceTranslation}</p>
                )}
                {encounter.chapter && <p className={styles.meta}>{encounter.chapter}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
