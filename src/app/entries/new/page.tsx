"use client";

import { Suspense } from "react";
import { EntryForm } from "@/components/entries/EntryForm";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewEntryPage() {
  return (
    <>
      <PageHeader title="新增紀事" backHref="/entries" />
      <PageBody>
        <div className="shrink-0 md:min-h-0 md:flex-1">
          <Suspense fallback={null}>
            <EntryForm />
          </Suspense>
        </div>
      </PageBody>
    </>
  );
}
