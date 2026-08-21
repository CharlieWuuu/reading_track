"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { JournalForm } from "@/features/journal/components/journal-form";
import { JournalFormTabs } from "@/features/journal/components/journal-form-tabs";
import { useJournal } from "@/hooks/use-journal";

function EditJournal() {
  const { id } = useParams<{ id: string }>();
  const { journal, isLoading, error } = useJournal();
  const entry = journal.find((e) => e.id === id);

  return (
    <>
      <PageHeader title="編輯書寫" backHref="/journal" action={entry && <JournalFormTabs />} />
      <PageBody>
        <RecordGate loading={isLoading} error={error} missing={!entry && "找不到這一筆"}>
          <div className="flex min-h-0 flex-1 flex-col">
            <JournalForm key={entry?.id} entry={entry} />
          </div>
        </RecordGate>
      </PageBody>
    </>
  );
}

/** 分頁列與表單都讀網址參數，整頁包一層 Suspense，靜態預先產生才不會失敗 */
export default function EditJournalPage() {
  return (
    <Suspense fallback={null}>
      <EditJournal />
    </Suspense>
  );
}
