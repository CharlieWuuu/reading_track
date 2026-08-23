"use client";

import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { ActionButton } from "@/components/ui/controls";
import { DetailField, DetailFields, DetailSection } from "@/components/ui/detail";
import { Favicon } from "@/components/ui/favicon";
import { NoteBlock } from "@/components/ui/note-block";
import { TagList } from "@/components/ui/tag-badge";
import { articleEditHref } from "@/config/routes";
import { KeywordTag } from "@/features/keywords/components/keyword-tag";
import { useArticles } from "@/hooks/use-articles";
import { splitLines } from "@/types/book";

const KEYWORD_TAG =
  "rounded-control bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200";

/** 一篇文章的詳細頁。跟書籍那一頁同一種排版，只是欄位少很多 */
export function ArticleDetailView() {
  const { id } = useParams<{ id: string }>();
  const { articles, isLoading, error } = useArticles();
  const article = articles.find((a) => a.id === id);
  const keywords = splitLines(article?.keywords);

  return (
    <>
      <PageHeader
        title={article?.title ?? "文章"}
        backHref="/reading/articles"
        action={article && <ActionButton href={articleEditHref(article.id)}>編輯</ActionButton>}
      />
      <PageBody>
        <RecordGate loading={isLoading} error={error} missing={!article && "找不到這篇文章"}>
          {article && (
            <div className="flex flex-col gap-6">
              <DetailFields>
                <div>
                  <DetailField label="作者">{article.author}</DetailField>
                  <DetailField label="站台">
                    <span className="inline-flex items-center gap-1.5">
                      <Favicon
                        url={article.sourceUrl}
                        fallback={article.platform}
                        className="size-4"
                      />
                      {article.platform}
                    </span>
                  </DetailField>
                  <DetailField label="語言">{article.language}</DetailField>
                </div>
                <div>
                  <DetailField label="讀完">{article.endDate}</DetailField>
                  <DetailField label="領域">
                    <TagList values={[article.domain]} tone="domain" />
                    <TagList values={[article.subDomain]} tone="subDomain" />
                  </DetailField>
                  <DetailField label="來源">
                    {article.sourceUrl && (
                      <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={article.sourceUrl}
                        className="inline-flex items-center gap-1 text-blue-700 underline underline-offset-2 hover:text-blue-900"
                      >
                        原始頁面
                        <ExternalLink size={12} strokeWidth={1.5} aria-hidden />
                      </a>
                    )}
                  </DetailField>
                </div>
              </DetailFields>

              {keywords.length > 0 && (
                <DetailSection title="關鍵字">
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map((name) => (
                      <KeywordTag key={name} name={name} className={KEYWORD_TAG} />
                    ))}
                  </div>
                </DetailSection>
              )}

              {article.note.trim() && (
                <DetailSection title="心得">
                  <NoteBlock note={article.note} />
                </DetailSection>
              )}
            </div>
          )}
        </RecordGate>
      </PageBody>
    </>
  );
}
