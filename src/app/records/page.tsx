"use client";

import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { AddRecordButton } from "@/features/overview/components/add-record-button";
import { GroupViewMenu } from "@/features/overview/components/group-view-menu";
import { KindTabs } from "@/features/overview/components/kind-tabs";
import { RecordsOverview } from "@/features/overview/components/records-overview";
import { useGroupView } from "@/hooks/use-group-view";
import { useMounted } from "@/hooks/use-mounted";

/** 側欄點「紀錄」進來的那一頁。子類型各自的清單還在原本的網址上 */
export default function RecordsPage() {
  const mounted = useMounted();
  const view = useGroupView();

  return (
    <>
      <PageHeader
        title="紀錄"
        action={
          <div className="flex min-w-0 items-center gap-5">
            <GroupViewMenu />
            <AddRecordButton group="records" />
          </div>
        }
      />
      <KindTabs group="records" />
      <PageBody scroll={view === "table"}>{mounted && <RecordsOverview view={view} />}</PageBody>
    </>
  );
}
