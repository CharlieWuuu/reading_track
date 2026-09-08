"use client";

import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { AddRecordButton } from "@/features/overview/components/add-record-button";
import { GroupViewMenu } from "@/features/overview/components/group-view-menu";
import { RecordsOverview } from "@/features/overview/components/records-overview";
import { useMounted } from "@/hooks/use-mounted";
import { useUrlParams } from "@/hooks/use-url-param";
import { isGroupViewMode, useGroupViewStore } from "@/stores/use-group-view-store";

/** 側欄點「紀錄」進來的那一頁。子類型各自的清單還在原本的網址上 */
export default function RecordsPage() {
  const mounted = useMounted();
  const { searchParams } = useUrlParams();
  const { view: savedView } = useGroupViewStore();
  const urlView = searchParams.get("view");
  const view = isGroupViewMode(urlView) ? urlView : savedView;

  return (
    <>
      <PageHeader
        title="紀錄"
        action={
          <div className="flex items-center gap-2">
            <GroupViewMenu />
            <AddRecordButton group="records" />
          </div>
        }
      />
      <PageBody>{mounted && <RecordsOverview view={view} />}</PageBody>
    </>
  );
}
