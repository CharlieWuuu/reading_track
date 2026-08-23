"use client";

import { ExternalLink } from "lucide-react";
import { BookCover } from "@/components/ui/book-cover";
import { KeywordEntry } from "@/features/keywords/utils/keyword-stats";
import { topicLabel } from "@/features/keywords/utils/topic-labels";
import { KeywordInfo } from "@/types/keyword";

const styles = {
  card: "flex cursor-pointer flex-col gap-2 rounded-surface border border-rule-strong bg-white p-4 hover:bg-gray-50",
  head: "flex items-baseline justify-between gap-2",
  name: "flex min-w-0 items-center gap-1.5 truncate text-sm font-medium",
  count: "shrink-0 text-xs text-gray-400 tabular-nums",
  meta: "flex shrink-0 flex-wrap items-center justify-end gap-1.5",
  topic: "rounded-control bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600",
  span: "text-[11px] text-gray-400 tabular-nums",
  summary: "text-xs leading-relaxed text-gray-600",
  wiki: "shrink-0 text-gray-300 hover:text-blue-700",
  // 封面靠右下角，淡淡一排就好：它是註腳，不是這張卡的主角
  covers: "mt-auto flex items-end justify-end gap-1 pt-1 opacity-60",
  more: "self-center text-[10px] text-gray-400 tabular-nums",
};

type KeywordCardProps = {
  entry: KeywordEntry;
  /** 主檔還沒補到這個關鍵字時就沒有，卡片照樣顯示書單 */
  info?: KeywordInfo;
  onEdit: () => void;
};

/** 一個關鍵字一張卡：維基查回來的摘要與領域，加上哪些書提到它 */
export function KeywordCard({ entry, info, onEdit }: KeywordCardProps) {
  const topics = info?.topics ? info.topics.split("、").filter(Boolean).map(topicLabel) : [];
  return (
    <div className={styles.card} onClick={onEdit}>
      <div className={styles.head}>
        {/* 維基連結緊貼著關鍵字，它講的是這個字本身 */}
        <span className={styles.name}>
          {entry.name}
          {info?.wikiUrl && (
            <a
              onClick={(e) => e.stopPropagation()}
              href={info.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="維基百科"
              aria-label="維基百科"
              className={styles.wiki}
            >
              <ExternalLink size={13} strokeWidth={1.5} />
            </a>
          )}
        </span>
        {/* 領域放在書名右邊；只被一本書提到是常態，標「1 本」只是雜訊 */}
        <div className={styles.meta}>
          {topics.map((topic) => (
            <span key={topic} className={styles.topic}>
              {topic}
            </span>
          ))}
          {entry.books.length > 1 && <span className={styles.count}>{entry.books.length} 本</span>}
        </div>
      </div>

      {info?.span && <span className={styles.span}>{info.span}</span>}

      {info?.summary && <p className={styles.summary}>{info.summary}</p>}

      {/* 提到它的書只用封面表示，超過五本就用 +n 收掉 */}
      <div className={styles.covers}>
        {entry.books.slice(0, 5).map((book) => (
          <BookCover key={book.id} url={book.coverUrl} title={book.title} size="xs" />
        ))}
        {entry.books.length > 5 && <span className={styles.more}>+{entry.books.length - 5}</span>}
      </div>
    </div>
  );
}
