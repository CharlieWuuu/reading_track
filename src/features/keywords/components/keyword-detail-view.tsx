"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { BookCover } from "@/components/ui/book-cover";
import { ActionButton } from "@/components/ui/controls";
import { DetailSection } from "@/components/ui/detail";
import { kindHref } from "@/config/kind-routes";
import { articleHref, bookHref, keywordEditHref, writingHref } from "@/config/routes";
import { useKeywordInfos } from "@/features/keywords/api/use-keyword-infos";
import { getKeywordMentions } from "@/features/keywords/utils/keyword-stats";
import { topicLabel } from "@/features/keywords/utils/topic-labels";
import { useArticles } from "@/hooks/use-articles";
import { useBooks } from "@/hooks/use-books";
import { useWritings } from "@/hooks/use-writings";
import { formatSpan, parseSpan } from "@/types/keyword";
import { tagColorClass } from "@/utils/tag-colors";

const styles = {
  head: "flex flex-wrap items-center gap-2",
  topic: "rounded-control px-1.5 py-0.5 text-[11px] font-medium",
  span: "text-[11px] text-gray-400 tabular-nums",
  summary: "text-sm leading-relaxed text-gray-700",
  empty: "text-xs text-gray-400",
  list: "flex flex-col",
  row: "flex items-center gap-2 rounded-control py-1 text-sm hover:bg-gray-50",
  title: "min-w-0 truncate",
  wiki: "flex items-center gap-1 rounded-control border px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50",
};

/** 一個關鍵字自己的一頁：這是什麼、我在哪看過它——讀的動作，要改再按編輯 */
export function KeywordDetailView() {
  const { name: rawName } = useParams<{ name: string }>();
  const name = decodeURIComponent(rawName);
  const { byName, isLoading: loadingInfos } = useKeywordInfos();
  const { books, isLoading: loadingBooks } = useBooks();
  const { articles, isLoading: loadingArticles } = useArticles();
  const { writings, isLoading: loadingWriting } = useWritings();
  const loading = loadingInfos || loadingBooks || loadingArticles || loadingWriting;

  const info = byName.get(name);
  const tags = info?.tags ? info.tags.split("、").filter(Boolean).map(topicLabel) : [];
  const span = parseSpan(info?.span ?? "");
  const mentions = getKeywordMentions(name, books, articles, writings);
  const nothing =
    !info?.summary &&
    mentions.books.length === 0 &&
    mentions.articles.length === 0 &&
    mentions.writings.length === 0;

  return (
    <>
      <PageHeader
        title={name}
        size="compact"
        parent={[
          { label: "片段", href: "/fragments" },
          { label: "關鍵字", href: kindHref("fragments", "keywords") },
        ]}
        backHref={kindHref("fragments", "keywords")}
        action={<ActionButton href={keywordEditHref(name)}>編輯</ActionButton>}
      />
      <PageBody>
        <RecordGate loading={loading}>
          <div className="flex flex-col gap-6">
            <div className={styles.head}>
              {tags.map((tag) => (
                <span key={tag} className={`${styles.topic} ${tagColorClass(tag, [])}`}>
                  {tag}
                </span>
              ))}
              {span && (
                <span className={styles.span}>
                  {formatSpan(String(span.from ?? ""), String(span.to ?? ""))}
                </span>
              )}
              {info?.wikiUrl && (
                <a
                  href={info.wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.wiki} ml-auto`}
                >
                  <ExternalLink size={13} strokeWidth={1.5} />
                  維基
                </a>
              )}
            </div>

            {info?.summary ? (
              <p className={styles.summary}>{info.summary}</p>
            ) : (
              <p className={styles.empty}>還沒有摘要，可以按編輯去查維基</p>
            )}

            {mentions.books.length > 0 && (
              <DetailSection title="書">
                <div className={styles.list}>
                  {mentions.books.map((book) => (
                    <Link key={book.id} href={bookHref(book.id)} className={styles.row}>
                      <BookCover url={book.coverUrl} title={book.title} size="sm" />
                      <span className={styles.title}>{book.title}</span>
                    </Link>
                  ))}
                </div>
              </DetailSection>
            )}

            {mentions.articles.length > 0 && (
              <DetailSection title="文章">
                <div className={styles.list}>
                  {mentions.articles.map((article) => (
                    <Link key={article.id} href={articleHref(article.id)} className={styles.row}>
                      <span className={styles.title}>{article.title}</span>
                    </Link>
                  ))}
                </div>
              </DetailSection>
            )}

            {mentions.writings.length > 0 && (
              <DetailSection title="書寫">
                <div className={styles.list}>
                  {mentions.writings.map((writing) => (
                    <Link key={writing.id} href={writingHref(writing.id)} className={styles.row}>
                      <span className={styles.title}>{writing.title}</span>
                    </Link>
                  ))}
                </div>
              </DetailSection>
            )}

            {nothing && <p className={styles.empty}>還沒有任何紀錄提到它</p>}
          </div>
        </RecordGate>
      </PageBody>
    </>
  );
}
