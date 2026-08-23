"use client";

import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { SelectMenu } from "@/components/ui/controls";
import { isStatsType, resolveView, STATS_TYPES, statsHref, viewsFor } from "@/config/stats-views";
import { useUrlParams } from "@/hooks/use-url-param";

/**
 * 統計的頁首：兩顆選單，「看哪一種東西」與「怎麼看」。
 *
 * 類型走路徑、顯示方式走查詢參數——類型換的是資料來源（各自一支 page.tsx），
 * 顯示方式換的只是同一份資料的畫法。
 */
function StatsHeader() {
  const router = useRouter();
  const segment = usePathname().split("/")[2];
  const type = isStatsType(segment) ? segment : "books";
  const { searchParams } = useUrlParams();
  const view = resolveView(type, searchParams.get("view"));
  const views = viewsFor(type);

  return (
    <PageHeader
      title="統計"
      action={
        <div className="flex min-w-0 items-center gap-2">
          <SelectMenu
            label="類型"
            items={STATS_TYPES}
            value={type}
            // 換類型時目前的看法可能不適用，resolveView 會退回圖表
            onChange={(next) => router.push(statsHref(next, resolveView(next, view)))}
          />
          {/* 只有一種看法時那顆選單沒有意義，不畫 */}
          {views.length > 1 && (
            <SelectMenu
              label="顯示方式"
              items={views}
              value={view}
              onChange={(next) => router.push(statsHref(type, next))}
            />
          )}
        </div>
      }
    />
  );
}

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 頁首讀 ?view=，要有 Suspense 邊界才預先產生得了 */}
      <Suspense fallback={null}>
        <StatsHeader />
      </Suspense>
      <PageBody>{children}</PageBody>
    </>
  );
}
