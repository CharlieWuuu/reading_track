"use client";

import { BookOpen, Newspaper, Quote } from "lucide-react";
import { LineListInput } from "@/components/ui/line-list-input";
import { RecordLinkPicker } from "@/features/books/components/record-link-picker";
import { RelatedWriting } from "@/features/writing/components/related-writings";
import type { QuoteRow, VocabularyRow } from "@/types/record";

const styles = {
  row: "flex min-h-0 flex-col gap-3 sm:flex-row",
  // 兩邊都是 w-1/2：內容長短不一樣，不加 min-w-0 的話長的那邊會把短的擠掉
  half: "flex min-h-0 w-full min-w-0 flex-col gap-1 sm:w-1/2",
  label:
    "flex shrink-0 items-center gap-1.5 text-label font-medium tracking-label text-ink-faint uppercase",
  icon: "shrink-0 text-ink-faint",
  hint: "rounded-control border-rule border border-dashed px-3 py-2 text-meta text-ink-faint",
};

/**
 * 從這本書留下來的東西：佳句、單字、書寫、相關文章。
 *
 * 佳句與單字不在這裡新增內容——那是 QuickAddRecordForm、各自詳情頁的事。
 * 這裡只管「連到哪本書」：列出已連結的，搜尋還沒連書的既有紀錄接上來。
 */
type LinkGroup<T> = {
  linked: T[];
  unlinked: T[];
  onLink: (row: T) => void;
  onUnlink: (row: T) => void;
};

export function BookRecordPanel({
  quotes,
  vocabulary,
  relatedArticles,
  onRelatedArticles,
  writingSourceIds,
  onWrite,
  /** 還沒存的書沒有編號，沒有東西可以連——存好書之後才能連結既有的佳句／單字 */
  canLink,
}: {
  quotes: LinkGroup<QuoteRow>;
  vocabulary: LinkGroup<VocabularyRow>;
  relatedArticles: string;
  onRelatedArticles: (value: string) => void;
  /** 這本書的每一次閱讀；還沒存的書給 null，那時還沒有東西可以掛 */
  writingSourceIds: string[] | null;
  onWrite: () => void;
  canLink: boolean;
}) {
  return (
    <>
      <div className={styles.row}>
        <div className={styles.half}>
          <label className={styles.label}>
            <Quote size={14} strokeWidth={1.5} className={styles.icon} />
            佳句
          </label>
          {canLink ? (
            <RecordLinkPicker
              linked={quotes.linked}
              unlinked={quotes.unlinked}
              labelOf={(row) => row.text}
              onLink={quotes.onLink}
              onUnlink={quotes.onUnlink}
              placeholder="搜尋還沒連書的佳句"
            />
          ) : (
            <p className={styles.hint}>存好這本書之後就可以連結既有的佳句</p>
          )}
        </div>

        <div className={styles.half}>
          <label className={styles.label}>
            <BookOpen size={14} strokeWidth={1.5} className={styles.icon} />
            單字
          </label>
          {canLink ? (
            <RecordLinkPicker
              linked={vocabulary.linked}
              unlinked={vocabulary.unlinked}
              labelOf={(row) => row.word}
              onLink={vocabulary.onLink}
              onUnlink={vocabulary.onUnlink}
              placeholder="搜尋還沒連書的單字"
            />
          ) : (
            <p className={styles.hint}>存好這本書之後就可以連結既有的單字</p>
          )}
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
