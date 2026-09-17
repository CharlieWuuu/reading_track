"use client";

import { notFound, useParams } from "next/navigation";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { NAV_GROUPS } from "@/config/nav";
import { KindGroup } from "@/config/record-kinds";
import { FragmentsOverview } from "@/features/overview/components/fragments-overview";
import { GroupViewMenu } from "@/features/overview/components/group-view-menu";
import { RecordsOverview } from "@/features/overview/components/records-overview";
import { useGroupView } from "@/hooks/use-group-view";

/**
 * 三個 group 的概覽共用這一頁：/records、/fragments、/writings。
 *
 * group 走網址參數，但合法值仍然只有 NAV_GROUPS 那三個——第二層是封閉的，
 * 路由用 slug 只是不想把同一份程式碼抄三遍，不是開放新增第四個 group。
 *
 * 紀錄那個 group 排法不同（作品那一層），所以分派留在這裡；
 * 片段與書寫同一支，只差傳什麼 group 進去。
 */
export default function GroupPage() {
  const { group } = useParams<{ group: string }>();
  const view = useGroupView();

  const nav = NAV_GROUPS.find((item) => item.kindGroup === group);
  // 一層路徑的實體資料夾（/stats、/settings…）靜態優先，走不到這裡；
  // 打錯字的網址才會進來，那就是找不到
  if (!nav?.kindGroup) notFound();

  return (
    <>
      <PageHeader title={nav.label} action={<GroupViewMenu />} />
      <PageBody scroll={view === "table"}>
        {nav.kindGroup === "records" ? (
          <RecordsOverview view={view} />
        ) : (
          <FragmentsOverview group={nav.kindGroup as KindGroup} view={view} />
        )}
      </PageBody>
    </>
  );
}
