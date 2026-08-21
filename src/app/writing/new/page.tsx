"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { WritingForm } from "@/features/writing/components/writing-form";
import { WritingFormTabs } from "@/features/writing/components/writing-form-tabs";

function NewWriting() {
  return (
    <>
      <PageHeader title="新增書寫" backHref="/writing" action={<WritingFormTabs />} />
      <PageBody>
        <div className="flex min-h-0 flex-1 flex-col">
          <WritingForm />
        </div>
      </PageBody>
    </>
  );
}

/** 分頁列與表單都讀網址參數，整頁包一層 Suspense，靜態預先產生才不會失敗 */
export default function NewWritingPage() {
  return (
    <Suspense fallback={null}>
      <NewWriting />
    </Suspense>
  );
}
