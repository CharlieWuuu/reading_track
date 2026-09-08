"use client";

import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { AddRecordButton } from "@/features/overview/components/add-record-button";
import { FragmentsOverview } from "@/features/overview/components/fragments-overview";
import { useMounted } from "@/hooks/use-mounted";

/** 側欄點「專欄」進來的那一頁。日記、心得、論述、每日計畫混在同一份清單裡 */
export default function ColumnsPage() {
  const mounted = useMounted();

  return (
    <>
      <PageHeader title="專欄" action={<AddRecordButton group="writings" />} />
      <PageBody>
        {mounted && <FragmentsOverview group="writings" headlineLabel="最近寫的一則" />}
      </PageBody>
    </>
  );
}
