"use client";

import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { AddRecordButton } from "@/features/overview/components/add-record-button";
import { FragmentsOverview } from "@/features/overview/components/fragments-overview";
import { GroupViewMenu } from "@/features/overview/components/group-view-menu";
import { useMounted } from "@/hooks/use-mounted";
import { useUrlParams } from "@/hooks/use-url-param";
import { isGroupViewMode, useGroupViewStore } from "@/stores/use-group-view-store";

/** 側欄點「片段」進來的那一頁。佳句、單字、關鍵字混在同一份清單裡 */
export default function FragmentsPage() {
  const mounted = useMounted();
  const { searchParams } = useUrlParams();
  const { view: savedView } = useGroupViewStore();
  const urlView = searchParams.get("view");
  const view = isGroupViewMode(urlView) ? urlView : savedView;

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
      <PageBody scroll={view === "table"}>
        {mounted && (
          <FragmentsOverview group="fragments" headlineLabel="最近摘下的一則" view={view} />
        )}
      </PageBody>
    </>
  );
}
