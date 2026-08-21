"use client";

import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { BookCover } from "@/components/ui/book-cover";
import { Dialog } from "@/components/ui/dialog";
import { useKeywordInfos } from "@/features/keywords/api/use-keyword-infos";
import { getKeywordMentions } from "@/features/keywords/utils/keyword-stats";
import { topicLabel } from "@/features/keywords/utils/topic-labels";
import { useArticles } from "@/hooks/use-articles";
import { useBooks } from "@/hooks/use-books";
import { useWritings } from "@/hooks/use-writings";
import { keywordEditHref, useCurrentHref } from "@/lib/keywords/href";
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
  const { byName, isLoading: loadingInfos } = useKeywordInfos();
  const { books, isLoading: loadingBooks } = useBooks();
  const { articles, isLoading: loadingArticles } = useArticles();
  const { writings, isLoading: loadingWriting } = useWritings();
  // 「沒有摘要」「沒有紀錄提到它」都是載完才下得了的判斷，載入中就只說載入中
  const loading = loadingInfos || loadingBooks || loadingArticles || loadingWriting;

  const info = byName.get(name);
  const topics = info?.topics ? info.topics.split("、").filter(Boolean).map(topicLabel) : [];
  const span = parseSpan(info?.span ?? "");
  const mentions = getKeywordMentions(name, books, articles, writings);
  const nothing =
    !info?.summary &&
    mentions.books.length === 0 &&
    mentions.articles.length === 0 &&
    mentions.writings.length === 0;

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
        ) : loading ? (
          <p className={styles.empty}>載入中…</p>
        ) : (
          <p className={styles.empty}>還沒有摘要，可以按編輯去查維基</p>
        )}

        {mentions.books.length > 0 && (
          <div className={styles.group}>
            <span className={styles.groupLabel}>書</span>
            <div className={styles.list}>
              {mentions.books.map((book) => (
                <Link key={book.id} href={`/books/${book.id}`} className={styles.row}>
                  <BookCover url={book.coverUrl} title={book.title} size="sm" />
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

        {mentions.writings.length > 0 && (
          <div className={styles.group}>
            <span className={styles.groupLabel}>書寫</span>
            <div className={styles.list}>
              {mentions.writings.map((writings) => (
                <Link
                  key={writings.id}
                  href={`/writing/${writings.id}/edit`}
                  className={styles.row}
                >
                  <span className={styles.title}>{writings.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!loading && nothing && <p className={styles.empty}>還沒有任何紀錄提到它</p>}

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
