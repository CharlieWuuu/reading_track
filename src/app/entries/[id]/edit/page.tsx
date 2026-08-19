"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { EntryForm } from "@/features/entries/components/entry-form";
import { EntryFormTabs } from "@/features/entries/components/entry-form-tabs";
import { useEntries } from "@/hooks/useEntries";

function EditEntry() {
  const { id } = useParams<{ id: string }>();
  const { entries, isLoading, error } = useEntries();
  const entry = entries.find((e) => e.id === id);

  return (
    <>
      <PageHeader title="編輯書寫" backHref="/entries" action={entry && <EntryFormTabs />} />
      <PageBody>
        <RecordGate loading={isLoading} error={error} missing={!entry && "找不到這一筆"}>
          <div className="flex min-h-0 flex-1 flex-col">
            <EntryForm key={entry?.id} entry={entry} />
          </div>
        </RecordGate>
      </PageBody>
    </>
  );
}

/** 分頁列與表單都讀網址參數，整頁包一層 Suspense，靜態預先產生才不會失敗 */
export default function EditEntryPage() {
  return (
    <Suspense fallback={null}>
      <EditEntry />
    </Suspense>
  );
}
