"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { EntryForm } from "@/components/entries/EntryForm";
import { EntryFormTabs } from "@/components/entries/EntryFormTabs";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { useEntries } from "@/lib/useEntries";
import { useSheetStore } from "@/store/useSheetStore";

function EditEntry() {
  const { id } = useParams<{ id: string }>();
  const { sheetId } = useSheetStore();
  const { entries, isLoading, error } = useEntries();
  const entry = entries.find((e) => e.id === id);

  if (!sheetId || isLoading || error || !entry) {
    return (
      <>
        <PageHeader title="編輯書寫" backHref="/entries" />
        <PageMessage tone={error ? "error" : "muted"}>
          {!sheetId
            ? "請先到「設定」頁面連接 Google Sheet"
            : isLoading
              ? "載入中…"
              : error || "找不到這一筆"}
        </PageMessage>
      </>
    );
  }

  return (
    <>
      <PageHeader title="編輯書寫" backHref="/entries" action={<EntryFormTabs />} />
      <PageBody>
        <div className="shrink-0 md:min-h-0 md:flex-1">
          <EntryForm key={entry.id} entry={entry} />
        </div>
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
