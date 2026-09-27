"use client";

import { PageBody, PageMain } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { ActionButton } from "@/components/ui/controls";
import { DetailHeader, DetailSection, DetailTitle, KindFacts } from "@/components/ui/detail";
import { KeywordTag } from "@/components/ui/keyword-tag";
import { KindSectionBlock } from "@/components/ui/kind-section/kind-section";
import { NoteBlock } from "@/components/ui/note-block";
import { TagList } from "@/components/ui/tag-badge";
import { kindHref } from "@/config/kind-routes";
import { articleEditHref } from "@/config/routes";
import { useArticles } from "@/hooks/use-articles";
import { useCatalogRecord } from "@/hooks/use-catalog-record";
import { useGroupFragments } from "@/hooks/use-group-fragments";
import { useKinds } from "@/hooks/use-kinds";
import { splitLines } from "@/types/book";
import { factFields, longFields } from "@/utils/detail-fields";
import { linkedTo, sectionsByKind } from "@/utils/overview-sections";

const KEYWORD_TAG =
  "rounded-control bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200";

// 標題那一區畫過的（有值才算）不重複列
const SHOWN_IN_HEADER = new Set(["creator", "domain", "subDomain"]);

/** 一篇文章的詳細頁。跟書籍那一頁同一種排版，只是欄位少很多 */
export function ArticleDetailView({ recordId }: { recordId: string }) {
  const id = recordId;
  const { articles, isLoading, error } = useArticles();
  const writings = useGroupFragments("writings");
  const { kinds } = useKinds();
  const article = articles.find((a) => a.id === id);
  // 欄位照類型勾的列，值讀通用的那一份——舊的 Article 形狀沒有摘要、數量這些
  const { record } = useCatalogRecord(id);
  const kind = kinds.find((k) => k.id === record?.kindId);
  const values = record?.values ?? {};
  // 書寫掛在這一篇那一列上，一種類型一區，照各自的卡片樣式
  const writingSections = article
    ? sectionsByKind(linkedTo(writings.fragments, new Set([article.id])), { take: Infinity })
    : [];
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
        <PageMain>
          <RecordGate loading={isLoading} error={error} missing={!article && "找不到這篇文章"}>
            {article && (
              <div className="flex flex-col gap-8">
                <DetailHeader
                  facts={
                    kind && (
                      <KindFacts
                        entries={factFields(kind, values, SHOWN_IN_HEADER)}
                        sourceUrl={values.externalUrl}
                      />
                    )
                  }
                >
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

                {kind &&
                  longFields(kind, values).map((field) => (
                    <DetailSection key={field.key} title={field.label}>
                      <NoteBlock note={field.value} />
                    </DetailSection>
                  ))}

                {writingSections.map((section) => (
                  <KindSectionBlock key={section.slug} group="writings" section={section} />
                ))}
              </div>
            )}
          </RecordGate>
        </PageMain>
      </PageBody>
    </>
  );
}
