"use client";

import { notFound, useParams } from "next/navigation";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { NAV_GROUPS } from "@/config/nav";
import { GroupOverviewPage } from "@/features/overview/components/group-overview-page";

/** /records、/fragments、/writings 共用這一頁。走網址參數不代表 group 開放自訂，合法值只有 NAV_GROUPS 那三個 */
export default function GroupPage() {
  const { group } = useParams<{ group: string }>();

  const nav = NAV_GROUPS.find((item) => item.kindGroup === group);
  if (!nav?.kindGroup) notFound(); // 實體資料夾（/stats、/settings…）靜態優先，走到這裡的是打錯字的網址

  return (
    <>
      <PageHeader title={nav.label} />
      <PageBody>
        <GroupOverviewPage group={nav.kindGroup} />
      </PageBody>
    </>
  );
}
