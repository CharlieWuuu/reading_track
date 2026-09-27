"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageBody, PageMain } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { ActionButton } from "@/components/ui/controls/action-button";
import { KindGroup } from "@/config/kind-groups";
import { kindHref } from "@/config/kind-routes";
import { viewsOfKind } from "@/config/kind-views";
import { NAV_GROUPS } from "@/config/nav";
import { KindCalendar } from "@/features/calendar/components/kind-calendar";
import { KindTimeline } from "@/features/calendar/components/kind-timeline";
import { KindCardWall } from "@/features/kinds/kind-card-wall";
import { KindOverview } from "@/features/kinds/kind-overview";
import { KindTable } from "@/features/kinds/kind-table";
import { KindViewMenu } from "@/features/kinds/kind-view-menu";
import { KindStats } from "@/features/stats/components/kind-stats";
import { useBookView } from "@/hooks/use-book-view";
import { useKindRecords } from "@/hooks/use-kind-records";
import { useKinds } from "@/hooks/use-kinds";
import { Kind } from "@/lib/db/queries/kinds";
import { fragmentsNewestFirst, recordsNewestFirst } from "@/utils/kind-list";

/**
 * 一個類型的清單頁。內建與自訂同一支——書籍、佳句也走這裡，沒有專屬頁。
 *
 * 有哪幾種檢視、卡片怎麼分段、要不要算重讀，全部讀類型設定（setting_kinds）。
 */

function KindBody({ kind }: { kind: Kind }) {
  const view = useBookView();
  const data = useKindRecords(kind.id);

  if (view === "stats") {
    return (
      <PageMain>
        <KindStats
          kind={kind}
          // 月曆與數線住在 features/calendar，統計那邊 import 不到；
          // kinds 不在 eslint 的 feature 區裡，兩邊的交會點就落在這裡
          wide={{
            calendar: <KindCalendar kind={kind} />,
            timeline: <KindTimeline kind={kind} />,
          }}
        />
      </PageMain>
    );
  }

  if (data.error)
    return (
      <PageMain>
        <PageMessage tone="error">{data.error}</PageMessage>
      </PageMain>
    );
  if (data.isLoading)
    return (
      <PageMain>
        <PageLoading />
      </PageMain>
    );

  const empty = kind.group === "records" ? data.records.length === 0 : data.fragments.length === 0;
  // 側欄把 0 筆的類型也列出來，點進來一片空白等於沒有下一步
  if (empty) {
    return (
      <PageMain>
        <PageMessage fill>
          還沒有任何{kind.name}。
          <Link href={`${kindHref(kind.group, kind.slug)}/new`} className="underline">
            記下第一筆
          </Link>
        </PageMessage>
      </PageMain>
    );
  }

  // 三種檢視都從最新往下，排序在這裡做一次
  const props = {
    kind,
    records: recordsNewestFirst(data.records),
    fragments: fragmentsNewestFirst(data.fragments),
  };
  if (view === "card")
    return (
      <PageMain>
        <KindCardWall {...props} />
      </PageMain>
    );
  if (view === "table")
    return (
      <PageMain>
        <KindTable {...props} />
      </PageMain>
    );
  return <KindOverview {...props} />; // 自己給中間與右欄
}

export function KindListPage({ group, slug }: { group: KindGroup; slug: string }) {
  const { kinds, isLoading } = useKinds();
  const kind = kinds.find((k) => k.group === group && k.slug === slug);
  // 麵包屑指回這個 group 的概覽，字跟側欄同一份設定
  const parent = NAV_GROUPS.find((nav) => nav.kindGroup === group);

  return (
    <>
      <PageHeader
        title={kind?.name ?? ""}
        parent={parent ? [{ label: parent.label, href: parent.href }] : undefined}
        action={
          kind && (
            <div className="flex min-w-0 items-center gap-2">
              <KindViewMenu
                modes={viewsOfKind(
                  kind.views,
                  kind.modules.map((module) => module.key),
                )}
              />
              <ActionButton href={`${kindHref(kind.group, kind.slug)}/new`} text="新增">
                <Plus size={16} strokeWidth={2} aria-hidden />
              </ActionButton>
            </div>
          )
        }
      />
      <PageBody>
        {isLoading ? (
          <PageMain>
            <PageLoading />
          </PageMain>
        ) : !kind ? (
          <PageMain>
            <PageMessage>找不到這個類型</PageMessage>
          </PageMain>
        ) : (
          <KindBody kind={kind} />
        )}
      </PageBody>
    </>
  );
}
