"use client";

import { BookOpen, Newspaper, Quote } from "lucide-react";
import { LineListInput } from "@/components/ui/line-list-input";
import { QuoteListInput } from "@/features/books/components/quote-list-input";
import { VocabularyListInput } from "@/features/books/components/vocabulary-list-input";
import { RelatedWriting } from "@/features/writing/components/related-writings";
import type { QuoteRow, VocabularyRow } from "@/types/record";

const styles = {
  row: "flex min-h-0 flex-col gap-3 sm:flex-row",
  // 兩邊都是 w-1/2：內容長短不一樣，不加 min-w-0 的話長的那邊會把短的擠掉
  half: "flex min-h-0 w-full min-w-0 flex-col gap-1 sm:w-1/2",
  label: "flex shrink-0 items-center gap-1.5 text-sm font-medium",
  icon: "shrink-0 text-gray-400",
  hint: "rounded-control border border-dashed px-3 py-2 text-xs text-gray-400",
};

/** 從這本書留下來的東西：佳句、單字、書寫、相關文章 */
export function BookRecordPanel({
  quoteRows,
  onQuotes,
  vocabularyRows,
  onVocabulary,
  bookLanguage,
  relatedArticles,
  onRelatedArticles,
  writingSourceIds,
  onWrite,
}: {
  quoteRows: QuoteRow[];
  onQuotes: (rows: QuoteRow[]) => void;
  vocabularyRows: VocabularyRow[];
  onVocabulary: (rows: VocabularyRow[]) => void;
  /** 單字的預設語言跟著書走 */
  bookLanguage: string;
  relatedArticles: string;
  onRelatedArticles: (value: string) => void;
  /** 這本書的每一次閱讀；還沒存的書給 null，那時還沒有東西可以掛 */
  writingSourceIds: string[] | null;
  onWrite: () => void;
}) {
  return (
    <>
      <div className={styles.row}>
        <div className={styles.half}>
          <label className={styles.label}>
            <Quote size={14} strokeWidth={1.5} className={styles.icon} />
            佳句
          </label>
          <QuoteListInput rows={quoteRows} onChange={onQuotes} />
        </div>

        <div className={styles.half}>
          <label className={styles.label}>
            <BookOpen size={14} strokeWidth={1.5} className={styles.icon} />
            單字
          </label>
          <VocabularyListInput
            rows={vocabularyRows}
            onChange={onVocabulary}
            bookLanguage={bookLanguage}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.half}>
          {writingSourceIds ? (
            <RelatedWriting sourceIds={writingSourceIds} onWrite={onWrite} />
          ) : (
            <p className={styles.hint}>存好這本書之後就可以寫心得了</p>
          )}
        </div>

        <div className={styles.half}>
          <label className={styles.label}>
            <Newspaper size={14} strokeWidth={1.5} className={styles.icon} />
            相關文章
          </label>
          <LineListInput
            value={relatedArticles}
            onChange={onRelatedArticles}
            placeholder="https://…"
          />
        </div>
      </div>
    </>
  );
}
