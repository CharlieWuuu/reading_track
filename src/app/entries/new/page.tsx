"use client";

import { Suspense } from "react";
import { EntryForm } from "@/features/entries/components/entry-form";
import { EntryFormTabs } from "@/features/entries/components/entry-form-tabs";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";

function NewEntry() {
  return (
    <>
      <PageHeader title="新增書寫" backHref="/entries" action={<EntryFormTabs />} />
      <PageBody>
        <div className="flex min-h-0 flex-1 flex-col">
          <EntryForm />
        </div>
      </PageBody>
    </>
  );
}

/** 分頁列與表單都讀網址參數，整頁包一層 Suspense，靜態預先產生才不會失敗 */
export default function NewEntryPage() {
  return (
    <Suspense fallback={null}>
      <NewEntry />
    </Suspense>
  );
}
