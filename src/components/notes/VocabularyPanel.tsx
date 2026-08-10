"use client";

import { CardMasonry } from "@/components/ui/CardMasonry";
import { VocabularyEntry } from "@/lib/vocabularyStats";

const styles = {
  card: "flex cursor-pointer flex-col gap-2 rounded-lg border bg-white p-4 hover:border-gray-400",
  head: "flex items-baseline justify-between gap-2",
  headWord: "min-w-0 truncate text-sm font-medium",
  meta: "flex min-w-0 shrink items-baseline justify-end gap-1.5",
  translation: "min-w-0 truncate text-xs text-gray-500",
  count: "shrink-0 text-xs text-gray-400 tabular-nums",
  list: "flex flex-col gap-2",
  entry: "flex flex-col gap-0.5",
  // 例句是原文，翻譯是輔助，兩者深淺分開才不會讀成同一段
  sentence: "text-xs leading-relaxed text-gray-700",
  sentenceTranslation: "text-xs leading-relaxed text-gray-400",
  // 封面靠右下角，淡淡一排就好：它是註腳，不是這張卡的主角
  covers: "mt-auto flex items-end justify-end gap-1 pt-1 opacity-60",
  cover: "aspect-2/3 w-4 rounded-[2px] object-cover shadow-sm ring-1 ring-black/10",
  blank:
    "flex aspect-2/3 w-4 items-center justify-center rounded-[2px] bg-gray-100 text-[7px] leading-none text-gray-400",
  more: "self-center text-[10px] text-gray-400 tabular-nums",
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
    <CardMasonry>
      {entries.map((entry) => {
        // 同一個詞在不同書可能各記了翻譯，重複的只留一個
        const translations = [
          ...new Set(entry.encounters.map((e) => e.wordTranslation).filter(Boolean)),
        ];
        return (
          <div key={entry.word} className={styles.card} onClick={() => onEdit(entry)}>
            <div className={styles.head}>
              <span className={styles.headWord}>{entry.word}</span>
              <div className={styles.meta}>
                {translations.length > 0 && (
                  <span className={styles.translation}>{translations.join("、")}</span>
                )}
                {/* 只遇過一次的不標次數，那是常態，標了只是雜訊 */}
                {entry.encounters.length > 1 && (
                  <span className={styles.count}>{entry.encounters.length} 次</span>
                )}
              </div>
            </div>

            <div className={styles.list}>
              {entry.encounters.map((encounter, i) => (
                <div key={i} className={styles.entry}>
                  {encounter.sentence && <p className={styles.sentence}>{encounter.sentence}</p>}
                  {encounter.sentenceTranslation && (
                    <p className={styles.sentenceTranslation}>{encounter.sentenceTranslation}</p>
                  )}
                </div>
              ))}
            </div>

            {/* 讀到它的書只用封面表示，超過五本就用 +n 收掉 */}
            <div className={styles.covers}>
              {entry.encounters.slice(0, 5).map((encounter, i) =>
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
              {entry.encounters.length > 5 && (
                <span className={styles.more}>+{entry.encounters.length - 5}</span>
              )}
            </div>
          </div>
        );
      })}
    </CardMasonry>
  );
}
