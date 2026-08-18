"use client";

import { Suspense } from "react";
import { EntryForm } from "@/components/entries/EntryForm";
import { EntryFormTabs } from "@/components/entries/EntryFormTabs";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";

function NewEntry() {
  return (
    <>
      <PageHeader title="新增書寫" backHref="/entries" action={<EntryFormTabs />} />
      <PageBody>
        <div className="shrink-0 md:min-h-0 md:flex-1">
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
