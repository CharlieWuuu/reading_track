"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { JournalForm } from "@/features/journal/components/journal-form";
import { JournalFormTabs } from "@/features/journal/components/journal-form-tabs";

function NewJournal() {
  return (
    <>
      <PageHeader title="新增書寫" backHref="/journal" action={<JournalFormTabs />} />
      <PageBody>
        <div className="flex min-h-0 flex-1 flex-col">
          <JournalForm />
        </div>
      </PageBody>
    </>
  );
}

/** 分頁列與表單都讀網址參數，整頁包一層 Suspense，靜態預先產生才不會失敗 */
export default function NewJournalPage() {
  return (
    <Suspense fallback={null}>
      <NewJournal />
    </Suspense>
  );
}
