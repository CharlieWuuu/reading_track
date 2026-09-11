"use client";

import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { AddRecordButton } from "@/features/overview/components/add-record-button";
import { FragmentsOverview } from "@/features/overview/components/fragments-overview";
import { GroupViewMenu } from "@/features/overview/components/group-view-menu";
import { KindTabs } from "@/features/overview/components/kind-tabs";
import { useGroupView } from "@/hooks/use-group-view";
import { useMounted } from "@/hooks/use-mounted";

/** 側欄點「片段」進來的那一頁。佳句、單字、關鍵字混在同一份清單裡 */
export default function FragmentsPage() {
  const mounted = useMounted();
  const view = useGroupView();

  return (
    <>
      <PageHeader
        title="片段"
        action={
          <div className="flex items-center gap-2">
            <GroupViewMenu />
            <AddRecordButton group="fragments" />
          </div>
        }
      />
      <KindTabs group="fragments" />
      <PageBody scroll={view === "table"}>
        {mounted && <FragmentsOverview group="fragments" view={view} />}
      </PageBody>
    </>
  );
}
