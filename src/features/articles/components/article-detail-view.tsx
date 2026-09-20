"use client";

import { ExternalLink } from "lucide-react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { ActionButton } from "@/components/ui/controls";
import { DetailField, DetailHeader, DetailSection, DetailTitle } from "@/components/ui/detail";
import { Favicon } from "@/components/ui/favicon";
import { NoteBlock } from "@/components/ui/note-block";
import { RelatedNotes } from "@/components/ui/related-notes";
import { TagList } from "@/components/ui/tag-badge";
import { kindHref } from "@/config/kind-routes";
import { PRIVATE_MARK } from "@/config/privacy";
import { articleEditHref } from "@/config/routes";
import { KeywordTag } from "@/features/keywords/components/keyword-tag";
import { useArticles } from "@/hooks/use-articles";
import { useKinds } from "@/hooks/use-kinds";
import { useWritings } from "@/hooks/use-writings";
import { Kind } from "@/lib/db/queries/kinds";
import { Article } from "@/types/article";
import { splitLines } from "@/types/book";
import { detailFields } from "@/utils/detail-fields";
import { notesByKind, notesForSource } from "@/utils/related-notes";

const KEYWORD_TAG =
  "rounded-control bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200";

/**
 * 右欄的資料卡。站台與來源自己畫（一個要配 favicon、一個要開新分頁），
 * 其餘照類型勾的模組列——本來四格全寫死，設定頁改了這裡不會變。
 */
function ArticleFacts({ article, kind }: { article: Article; kind?: Kind }) {
  const { shorts } = kind
    ? detailFields(kind, articleValues(article), SKIP_IN_FACTS)
    : { shorts: [] as ReturnType<typeof detailFields>["shorts"] };

  return (
    <>
      <DetailField label="站台" align="right">
        {article.platform && (
          <span className="inline-flex items-center gap-1.5">
            <Favicon url={article.sourceUrl} fallback={article.platform} className="size-4" />
            {article.platform}
          </span>
        )}
      </DetailField>
      {shorts.map((field) => (
        <DetailField key={field.key} label={field.label} align="right">
          {field.value}
        </DetailField>
      ))}
      <DetailField label="來源" align="right">
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
    </>
  );
}

/** 標題那一區與量化資訊行已經講過的，右欄不重複列 */
const SKIP_IN_FACTS = new Set([
  "title",
  "creator",
  "body",
  "domain",
  "subDomain",
  "platform",
  "externalUrl",
]);

/** Article 的舊形狀攤成模組那層的欄位名 */
function articleValues(article: Article): Record<string, string> {
  return {
    title: article.title,
    creator: article.author,
    platform: article.platform,
    endDate: article.endDate ?? "",
    language: article.language,
    domain: article.domain,
    subDomain: article.subDomain,
    attribute: article.type,
    body: article.note,
    isPrivate: article.private === PRIVATE_MARK ? "是" : "否",
  };
}

/** 一篇文章的詳細頁。跟書籍那一頁同一種排版，只是欄位少很多 */
export function ArticleDetailView({ recordId }: { recordId: string }) {
  const id = recordId;
  const { articles, isLoading, error } = useArticles();
  const { writings } = useWritings();
  const { kinds } = useKinds();
  const articleKind = kinds.find((k) => k.slug === "articles");
  const article = articles.find((a) => a.id === id);
  const notes = notesForSource(writings, article ? [article.id] : []);
  const keywords = splitLines(article?.keywords);

  return (
    <>
      <PageHeader
        title={article?.title ?? "文章"}
        size="compact"
        parent={[
          { label: "紀錄", href: "/records" },
          { label: "文章", href: kindHref("records", "articles") },
        ]}
        backHref={kindHref("records", "articles")}
        action={article && <ActionButton href={articleEditHref(article.id)}>編輯</ActionButton>}
      />
      <PageBody>
        <RecordGate loading={isLoading} error={error} missing={!article && "找不到這篇文章"}>
          {article && (
            <div className="flex flex-col gap-8">
              <DetailHeader facts={<ArticleFacts article={article} kind={articleKind} />}>
                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  <DetailTitle title={article.title} subtitle={article.author} />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <TagList values={[article.domain]} tone="domain" />
                    <TagList values={[article.subDomain]} tone="subDomain" />
                  </div>
                </div>
              </DetailHeader>

              {keywords.length > 0 && (
                <DetailSection title="關鍵字" count={`${keywords.length} 項`}>
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

              {notesByKind(notes).map((group) => (
                <DetailSection
                  key={group.kindName}
                  title={group.kindName}
                  count={`${group.notes.length} 項`}
                >
                  <RelatedNotes notes={group.notes} />
                </DetailSection>
              ))}
            </div>
          )}
        </RecordGate>
      </PageBody>
    </>
  );
}
