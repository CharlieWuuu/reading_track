"use client";

import { ExternalLink } from "lucide-react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { ActionButton } from "@/components/ui/controls";
import { DetailField, DetailHeader, DetailSection, DetailTitle } from "@/components/ui/detail";
import { NoteBlock } from "@/components/ui/note-block";
import { RelatedLinks } from "@/components/ui/related-links";
import { writingEditHref } from "@/config/routes";
import { useWritings } from "@/hooks/use-writings";
import { isUrl } from "@/utils/reflections";
import { tagColorClass } from "@/utils/tag-colors";

const KIND_TAG = "rounded-control px-1.5 py-0.5 text-xs font-medium";

/** 一則紀事的詳細頁。內文是主體，其餘欄位都是為了讓它好找 */
export function WritingDetailView({ recordId }: { recordId: string }) {
  const id = recordId;
  const { writings, isLoading, error } = useWritings();
  const writing = writings.find((w) => w.id === id);

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
        <RecordGate loading={isLoading} error={error} missing={!writing && "找不到這則紀事"}>
          {writing && (
            <div className="flex flex-col gap-8">
              <DetailHeader
                facts={
                  <>
                    <DetailField label="日期" align="right">
                      {writing.endDate}
                    </DetailField>
                    <DetailField label="類型" align="right">
                      {writing.kindName}
                    </DetailField>
                    <DetailField label="放在哪" align="right">
                      {writing.link &&
                        (isUrl(writing.link) ? (
                          <a
                            href={writing.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={writing.link}
                            className="inline-flex items-center gap-1 text-blue-700 underline underline-offset-2 hover:text-blue-900"
                          >
                            打開
                            <ExternalLink size={12} strokeWidth={1.5} aria-hidden />
                          </a>
                        ) : (
                          writing.link
                        ))}
                    </DetailField>
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
      </PageBody>
    </>
  );
}
