"use client";

import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { AddRecordButton } from "@/features/overview/components/add-record-button";
import { RecordsOverview } from "@/features/overview/components/records-overview";
import { useMounted } from "@/hooks/use-mounted";

/** 側欄點「紀錄」進來的那一頁。子類型各自的清單還在原本的網址上 */
export default function RecordsPage() {
  const mounted = useMounted();

  return (
    <>
      <PageHeader title="紀錄" action={<AddRecordButton group="records" />} />
      <PageBody>{mounted && <RecordsOverview />}</PageBody>
    </>
  );
}
