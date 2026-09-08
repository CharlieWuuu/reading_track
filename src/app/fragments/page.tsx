"use client";

import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { AddRecordButton } from "@/features/overview/components/add-record-button";
import { FragmentsOverview } from "@/features/overview/components/fragments-overview";
import { useMounted } from "@/hooks/use-mounted";

/** 側欄點「片段」進來的那一頁。佳句、單字、關鍵字混在同一份清單裡 */
export default function FragmentsPage() {
  const mounted = useMounted();

  return (
    <>
      <PageHeader title="片段" action={<AddRecordButton group="fragments" />} />
      <PageBody>
        {mounted && <FragmentsOverview group="fragments" headlineLabel="最近摘下的一則" />}
      </PageBody>
    </>
  );
}
