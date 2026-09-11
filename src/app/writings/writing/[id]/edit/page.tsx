"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { kindHref } from "@/config/kind-routes";
import { writingHref } from "@/config/routes";
import { WritingForm } from "@/features/writing/components/writing-form";
import { WritingFormTabs } from "@/features/writing/components/writing-form-tabs";
import { useWritings } from "@/hooks/use-writings";

function EditWriting() {
  const { id } = useParams<{ id: string }>();
  const { writings, isLoading, error } = useWritings();
  const entry = writings.find((e) => e.id === id);
  const entryLabel =
    entry && (entry.title.length > 5 ? `${entry.title.slice(0, 5)}…` : entry.title);

  return (
    <>
      <PageHeader
        title="編輯"
        size="compact"
        parent={[
          { label: "專欄", href: "/writings" },
          { label: "書寫", href: kindHref("writings", "writing") },
          ...(entryLabel ? [{ label: entryLabel, href: writingHref(id) }] : []),
        ]}
        backHref={kindHref("writings", "writing")}
        action={entry && <WritingFormTabs />}
      />
      <PageBody>
        <RecordGate loading={isLoading} error={error} missing={!entry && "找不到這一筆"}>
          <div className="flex min-h-0 flex-1 flex-col">
            <WritingForm key={entry?.id} entry={entry} />
          </div>
        </RecordGate>
      </PageBody>
    </>
  );
}

/** 分頁列與表單都讀網址參數，整頁包一層 Suspense，靜態預先產生才不會失敗 */
export default function EditWritingPage() {
  return (
    <Suspense fallback={null}>
      <EditWriting />
    </Suspense>
  );
}
