"use client";

import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { keywordEditHref, useCurrentHref } from "@/lib/keywords/href";
import { topicLabel } from "@/lib/keywords/topicLabels";
import { getKeywordMentions } from "@/lib/keywordStats";
import { useArticles } from "@/lib/useArticles";
import { useBooks } from "@/lib/useBooks";
import { useEntries } from "@/lib/useEntries";
import { useKeywordInfos } from "@/lib/useKeywordInfos";
import { formatSpan, parseSpan } from "@/types/keyword";

const styles = {
  wrap: "flex min-h-0 flex-col gap-3",
  head: "flex flex-wrap items-center gap-2",
  name: "mr-auto text-base font-semibold",
  topic: "rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600",
  span: "text-[11px] text-gray-400 tabular-nums",
  summary: "text-sm leading-relaxed text-gray-700",
  empty: "text-xs text-gray-400",
  group: "flex flex-col gap-1",
  groupLabel: "text-[11px] text-gray-400",
  list: "flex flex-col",
  row: "flex items-center gap-2 rounded py-1 text-sm hover:bg-gray-50",
  cover: "aspect-2/3 w-5 shrink-0 rounded-[2px] object-cover shadow-sm ring-1 ring-black/10",
  blank:
    "flex aspect-2/3 w-5 shrink-0 items-center justify-center rounded-[2px] bg-gray-100 text-[7px] text-gray-400",
  title: "min-w-0 truncate",
  actions: "flex items-center gap-2 pt-1",
  edit: "flex items-center gap-1 rounded border px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50",
  wiki: "flex items-center gap-1 rounded border px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50",
};

/**
 * 關鍵字的快看視窗。
 *
 * 點一個關鍵字最常見的意圖是「這是什麼、我在哪看過它」，那是讀的動作，
 * 不該把人從正在看的畫面抽走，也不該直接丟進一張表單。要改再按編輯。
 */
export function KeywordPopup({ name, onClose }: { name: string; onClose: () => void }) {
  const from = useCurrentHref();
  const { byName } = useKeywordInfos();
  const { books } = useBooks();
  const { articles } = useArticles();
  const { entries } = useEntries();

  const info = byName.get(name);
  const topics = info?.topics ? info.topics.split("、").filter(Boolean).map(topicLabel) : [];
  const span = parseSpan(info?.span ?? "");
  const mentions = getKeywordMentions(name, books, articles, entries);
  const nothing =
    !info?.summary &&
    mentions.books.length === 0 &&
    mentions.articles.length === 0 &&
    mentions.entries.length === 0;

  return (
    <Dialog title={name} showTitle={false} onClose={onClose}>
      <div className={styles.wrap}>
        <div className={styles.head}>
          <span className={styles.name}>{name}</span>
          {topics.map((topic) => (
            <span key={topic} className={styles.topic}>
              {topic}
            </span>
          ))}
          {span && (
            <span className={styles.span}>
              {formatSpan(String(span.from ?? ""), String(span.to ?? ""))}
            </span>
          )}
        </div>

        {info?.summary ? (
          <p className={styles.summary}>{info.summary}</p>
        ) : (
          <p className={styles.empty}>還沒有摘要，可以按編輯去查維基</p>
        )}

        {mentions.books.length > 0 && (
          <div className={styles.group}>
            <span className={styles.groupLabel}>書</span>
            <div className={styles.list}>
              {mentions.books.map((book) => (
                <Link key={book.id} href={`/books/${book.id}`} className={styles.row}>
                  {book.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.coverUrl} alt="" loading="lazy" className={styles.cover} />
                  ) : (
                    <span className={styles.blank}>{book.title.slice(0, 1)}</span>
                  )}
                  <span className={styles.title}>{book.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {mentions.articles.length > 0 && (
          <div className={styles.group}>
            <span className={styles.groupLabel}>文章</span>
            <div className={styles.list}>
              {mentions.articles.map((article) => (
                <Link key={article.id} href={`/articles/${article.id}/edit`} className={styles.row}>
                  <span className={styles.title}>{article.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {mentions.entries.length > 0 && (
          <div className={styles.group}>
            <span className={styles.groupLabel}>書寫</span>
            <div className={styles.list}>
              {mentions.entries.map((entry) => (
                <Link key={entry.id} href={`/entries/${entry.id}/edit`} className={styles.row}>
                  <span className={styles.title}>{entry.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {nothing && <p className={styles.empty}>還沒有任何紀錄提到它</p>}

        <div className={styles.actions}>
          <Link href={keywordEditHref(name, from)} className={styles.edit}>
            <Pencil size={13} strokeWidth={1.5} />
            編輯
          </Link>
          {info?.wikiUrl && (
            <a
              href={info.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.wiki}
            >
              <ExternalLink size={13} strokeWidth={1.5} />
              維基
            </a>
          )}
        </div>
      </div>
    </Dialog>
  );
}
