"use client";

import { useParams } from "next/navigation";
import { EntryForm } from "@/components/entries/EntryForm";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { useEntries } from "@/lib/useEntries";
import { useSheetStore } from "@/store/useSheetStore";

export default function EditEntryPage() {
  const { id } = useParams<{ id: string }>();
  const { sheetId } = useSheetStore();
  const { entries, isLoading, error } = useEntries();
  const entry = entries.find((e) => e.id === id);

  if (!sheetId || isLoading || error || !entry) {
    return (
      <>
        <PageHeader title="編輯紀事" backHref="/entries" />
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
      <PageHeader title="編輯紀事" backHref="/entries" />
      <PageBody>
        <div className="shrink-0 md:min-h-0 md:flex-1">
          <EntryForm key={entry.id} entry={entry} />
        </div>
      </PageBody>
    </>
  );
}
