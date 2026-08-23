"use client";

import { usePathname, useRouter } from "next/navigation";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { SegmentedControl } from "@/components/ui/controls";
import { STATS_TABS, StatsTab, statsTabHref } from "@/config/tabs";

/** 四個分頁共用的頁首；哪一頁被選中看網址，重新整理或分享連結都回得到同一個畫面 */
export default function StatsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segment = usePathname().split("/")[2];
  const tab = (STATS_TABS.some((t) => t.key === segment) ? segment : "books") as StatsTab;

  return (
    <>
      <PageHeader
        title="統計"
        action={
          <SegmentedControl
            items={STATS_TABS}
            value={tab}
            onChange={(next) => router.push(statsTabHref(next))}
          />
        }
      />
      <PageBody>{children}</PageBody>
    </>
  );
}
