"use client";

import { BookCover } from "@/components/ui/book-cover";
import { CardMasonry } from "@/components/ui/card-masonry";
import { VocabularyEntry } from "@/utils/vocabulary-stats";

const styles = {
  card: "flex cursor-pointer flex-col gap-2 rounded-surface border bg-white p-4 hover:bg-gray-50",
  head: "flex items-center justify-between gap-2",
  // 單字是這張卡的主角，大一級才看得出主從
  headWord: "min-w-0 truncate text-base font-semibold md:text-lg",
  pronunciation: "-mt-1 text-xs text-gray-400",
  translation: "-mt-1 text-xs text-gray-500",
  count: "shrink-0 text-xs text-gray-400 tabular-nums",
  list: "flex flex-col gap-2",
  writings: "flex flex-col gap-0.5",
  // 例句是原文，翻譯是輔助，兩者深淺分開才不會讀成同一段
  sentence: "text-xs leading-relaxed text-gray-700",
  sentenceTranslation: "text-xs leading-relaxed text-gray-400",
  // 封面靠右下角，淡淡一排就好：它是註腳，不是這張卡的主角
  covers: "flex shrink-0 items-center gap-1 opacity-60",
  empty: "py-6 text-center text-xs text-gray-400",
};

type VocabularyPanelProps = {
  writings: VocabularyEntry[];
  onEdit: (writings: VocabularyEntry) => void;
};

/** 單字一個詞一張卡，帶著讀到它的那一句 */
export function VocabularyPanel({ writings, onEdit }: VocabularyPanelProps) {
  if (writings.length === 0) {
    return <div className={styles.empty}>還沒有記下任何單字，先到書籍的「單字」欄記幾個</div>;
  }

  return (
    <CardMasonry>
      {writings.map((writings) => {
        // 同一個詞在不同書可能各記了翻譯，重複的只留一個
        const translations = [
          ...new Set(writings.encounters.map((e) => e.wordTranslation).filter(Boolean)),
        ];
        // 同一個詞的讀音在各本書應該一樣，取第一個有填的就好
        const pronunciation = writings.encounters.find((e) => e.pronunciation)?.pronunciation ?? "";
        return (
          <div key={writings.word} className={styles.card} onClick={() => onEdit(writings)}>
            <div className={styles.head}>
              <span className={styles.headWord}>{writings.word}</span>

              {/* 讀到它的書跟著標題同一列靠右：它是註腳，不該自己佔一行 */}
              <div className={styles.covers}>
                {writings.encounters.slice(0, 5).map((encounter, i) => (
                  <BookCover
                    key={i}
                    url={encounter.bookCover}
                    title={encounter.bookTitle}
                    size="xs"
                  />
                ))}
                {/* 只遇過一次的不標次數，那是常態，標了只是雜訊 */}
                {writings.encounters.length > 1 && (
                  <span className={styles.count}>{writings.encounters.length} 次</span>
                )}
              </div>
            </div>

            {pronunciation && <p className={styles.pronunciation}>{pronunciation}</p>}

            {/* 翻譯自己一行：跟單字擠同一行的話，長一點的就把單字壓掉了 */}
            {translations.length > 0 && (
              <p className={styles.translation}>{translations.join("、")}</p>
            )}

            <div className={styles.list}>
              {writings.encounters.map((encounter, i) => (
                <div key={i} className={styles.writings}>
                  {encounter.sentence && <p className={styles.sentence}>{encounter.sentence}</p>}
                  {encounter.sentenceTranslation && (
                    <p className={styles.sentenceTranslation}>{encounter.sentenceTranslation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </CardMasonry>
  );
}
