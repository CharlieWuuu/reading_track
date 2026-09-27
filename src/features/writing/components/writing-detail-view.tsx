"use client";

import { PageBody, PageMain } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { ActionButton } from "@/components/ui/controls";
import {
  DetailField,
  DetailHeader,
  DetailSection,
  DetailTitle,
  KindFacts,
} from "@/components/ui/detail";
import { NoteBlock } from "@/components/ui/note-block";
import { RelatedLinks } from "@/components/ui/related-links";
import { writingEditHref } from "@/config/routes";
import { useCatalogRecord } from "@/hooks/use-catalog-record";
import { useKinds } from "@/hooks/use-kinds";
import { useWritings } from "@/hooks/use-writings";
import { factFields } from "@/utils/detail-fields";
import { tagColorClass } from "@/utils/tag-colors";

const KIND_TAG = "rounded-control px-1.5 py-0.5 text-xs font-medium";

// 標題那一區畫過的（有值才算）不重複列；內文在底下自己一段
const SHOWN_IN_HEADER = new Set(["domain"]);

/** 一則紀事的詳細頁。內文是主體，其餘欄位都是為了讓它好找 */
export function WritingDetailView({ recordId }: { recordId: string }) {
  const id = recordId;
  const { writings, isLoading, error } = useWritings();
  const writing = writings.find((w) => w.id === id);
  // 欄位照類型勾的列，值讀通用的那一份
  const { kinds } = useKinds();
  const { record } = useCatalogRecord(id);
  const kind = kinds.find((k) => k.id === record?.kindId);
  const values = record?.values ?? {};

  return (
    <>
      <PageHeader
        title={writing?.title ?? "紀事"}
        size="compact"
        parent={[{ label: "書寫", href: "/writings" }]}
        backHref={"/writings"}
        action={writing && <ActionButton href={writingEditHref(writing.id)}>編輯</ActionButton>}
      />
      <PageBody>
        <PageMain>
          <RecordGate loading={isLoading} error={error} missing={!writing && "找不到這則紀事"}>
            {writing && (
              <div className="flex flex-col gap-8">
                <DetailHeader
                  facts={
                    <>
                      <DetailField label="類型" align="right">
                        {writing.kindName}
                      </DetailField>
                      {kind && (
                        <KindFacts
                          entries={factFields(kind, values, SHOWN_IN_HEADER)}
                          sourceUrl={values.externalUrl}
                        />
                      )}
                    </>
                  }
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <DetailTitle title={writing.title} />
                    {writing.topic && (
                      <span className="flex">
                        <span className={`${KIND_TAG} ${tagColorClass(writing.topic, [])}`}>
                          {writing.topic}
                        </span>
                      </span>
                    )}
                  </div>
                </DetailHeader>

                {/* 跟哪些資料有關：一個類型一區，出處與關鍵字都在裡面，不另外分方向 */}
                <RelatedLinks recordId={writing.id} />

                {writing.note.trim() && (
                  <DetailSection title="內文">
                    <NoteBlock note={writing.note} />
                  </DetailSection>
                )}
              </div>
            )}
          </RecordGate>
        </PageMain>
      </PageBody>
    </>
  );
}
