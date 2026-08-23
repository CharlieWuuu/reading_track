"use client";

import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { ActionButton } from "@/components/ui/controls";
import { DetailField, DetailFields, DetailSection } from "@/components/ui/detail";
import { NoteBlock } from "@/components/ui/note-block";
import { writingEditHref } from "@/config/routes";
import { KeywordTag } from "@/features/keywords/components/keyword-tag";
import { useWritings } from "@/hooks/use-writings";
import { splitLines, splitTags } from "@/types/book";
import { isUrl } from "@/utils/reflections";
import { tagColorClass } from "@/utils/tag-colors";

const KEYWORD_TAG =
  "rounded-control bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200";
const KIND_TAG = "rounded-control px-1.5 py-0.5 text-xs font-medium";

/** 一則紀事的詳細頁。內文是主體，其餘欄位都是為了讓它好找 */
export function WritingDetailView() {
  const { id } = useParams<{ id: string }>();
  const { writings, isLoading, error } = useWritings();
  const writing = writings.find((w) => w.id === id);
  const keywords = splitLines(writing?.keywords);

  return (
    <>
      <PageHeader
        title={writing?.title ?? "紀事"}
        backHref="/writing"
        action={writing && <ActionButton href={writingEditHref(writing.id)}>編輯</ActionButton>}
      />
      <PageBody>
        <RecordGate loading={isLoading} error={error} missing={!writing && "找不到這則紀事"}>
          {writing && (
            <div className="flex flex-col gap-6">
              <DetailFields>
                <div>
                  <DetailField label="日期">{writing.date}</DetailField>
                  <DetailField label="類型">
                    <span className="flex flex-wrap gap-1.5">
                      {splitTags(writing.kind).map((kind) => (
                        <span key={kind} className={`${KIND_TAG} ${tagColorClass(kind, [])}`}>
                          {kind}
                        </span>
                      ))}
                    </span>
                  </DetailField>
                </div>
                <div>
                  <DetailField label="延伸自">{writing.sourceTitle}</DetailField>
                  <DetailField label="放在哪">
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
