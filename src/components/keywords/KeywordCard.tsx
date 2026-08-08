"use client";

import Link from "next/link";
import { topicLabel } from "@/lib/keywords/topicLabels";
import { KeywordEntry } from "@/lib/keywordStats";
import { KeywordInfo } from "@/types/keyword";

const styles = {
  card: "flex cursor-pointer flex-col gap-2 rounded-lg border bg-white p-4 hover:border-gray-400",
  head: "flex items-baseline justify-between gap-2",
  name: "min-w-0 truncate text-sm font-medium",
  count: "shrink-0 text-xs text-gray-400 tabular-nums",
  meta: "flex flex-wrap items-center gap-1.5",
  topic: "rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600",
  span: "text-[11px] text-gray-400 tabular-nums",
  summary: "text-xs leading-relaxed text-gray-600",
  links: "flex flex-wrap items-center gap-x-3",
  wiki: "text-[11px] text-blue-700 underline underline-offset-2 hover:text-blue-900",
  list: "flex flex-col gap-1",
  book: "flex items-baseline gap-1.5 text-xs text-gray-500 hover:text-gray-900",
  year: "shrink-0 tabular-nums text-gray-400",
  title: "min-w-0 truncate",
};

type KeywordCardProps = {
  entry: KeywordEntry;
  /** 主檔還沒補到這個關鍵字時就沒有，卡片照樣顯示書單 */
  info?: KeywordInfo;
  onEdit: () => void;
};

/** 一個關鍵字一張卡：維基查回來的摘要與學科，加上哪些書提到它 */
export function KeywordCard({ entry, info, onEdit }: KeywordCardProps) {
  const topics = info?.topics ? info.topics.split("、").filter(Boolean).map(topicLabel) : [];
  return (
    <div className={styles.card} onClick={onEdit}>
      <div className={styles.head}>
        <span className={styles.name}>{entry.name}</span>
        <span className={styles.count}>{entry.books.length} 本</span>
      </div>

      {(topics.length > 0 || info?.span) && (
        <div className={styles.meta}>
          {topics.map((topic) => (
            <span key={topic} className={styles.topic}>
              {topic}
            </span>
          ))}
          {info?.span && <span className={styles.span}>{info.span}</span>}
        </div>
      )}

      {info?.summary && <p className={styles.summary}>{info.summary}</p>}

      <div className={styles.links}>
        <Link
          onClick={(e) => e.stopPropagation()}
          href={`/books?keyword=${encodeURIComponent(entry.name)}`}
          className={styles.wiki}
        >
          提到它的書
        </Link>
        {info?.wikiUrl && (
          <a
            onClick={(e) => e.stopPropagation()}
            href={info.wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.wiki}
          >
            維基百科
          </a>
        )}
      </div>

      <ul className={styles.list}>
        {entry.books.map((book) => (
          <li key={book.id}>
            <Link
              onClick={(e) => e.stopPropagation()}
              href={`/books/${book.id}/edit`}
              className={styles.book}
            >
              <span className={styles.year}>
                {(book.endDate ?? book.startDate ?? "").slice(0, 4)}
              </span>
              <span className={styles.title}>{book.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
