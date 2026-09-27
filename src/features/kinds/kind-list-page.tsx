"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { ActionButton } from "@/components/ui/controls/action-button";
import { kindHref } from "@/config/kind-routes";
import { viewsOfKind } from "@/config/kind-views";
import { NAV_GROUPS, unitOfKind } from "@/config/nav";
import { KindGroup } from "@/config/record-kinds";
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
import { countMeta } from "@/utils/kind-list";

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
      <KindStats
        kind={kind}
        // 月曆與數線住在 features/calendar，統計那邊 import 不到；
        // kinds 不在 eslint 的 feature 區裡，兩邊的交會點就落在這裡
        wide={{
          calendar: <KindCalendar kind={kind} />,
          timeline: <KindTimeline kind={kind} />,
        }}
      />
    );
  }

  if (data.error) return <PageMessage tone="error">{data.error}</PageMessage>;
  if (data.isLoading) return <PageLoading />;

  const empty = kind.group === "records" ? data.records.length === 0 : data.fragments.length === 0;
  // 側欄把 0 筆的類型也列出來，點進來一片空白等於沒有下一步
  if (empty) {
    return (
      <PageMessage fill>
        還沒有任何{kind.name}。
        <Link href={`${kindHref(kind.group, kind.slug)}/new`} className="underline">
          記下第一筆
        </Link>
      </PageMessage>
    );
  }

  const props = { kind, records: data.records, fragments: data.fragments };
  if (view === "card") return <KindCardWall {...props} />;
  if (view === "table") return <KindTable {...props} />;
  return <KindOverview {...props} />;
}

/** 頁首那行小字。紀錄可以設成連重讀一起算：「133 次・128 本」 */
function useCountMeta(kind?: Kind): string | undefined {
  const { records, fragments, isLoading } = useKindRecords(kind?.id ?? "");
  if (!kind || isLoading) return undefined;
  const rows = kind.group === "records" ? records : fragments;
  return countMeta(rows, unitOfKind(kind), kind.group === "records" && kind.countRereads);
}

export function KindListPage({ group, slug }: { group: KindGroup; slug: string }) {
  const { kinds, isLoading } = useKinds();
  const kind = kinds.find((k) => k.group === group && k.slug === slug);
  const meta = useCountMeta(kind);
  // 麵包屑指回這個 group 的概覽，字跟側欄同一份設定
  const parent = NAV_GROUPS.find((nav) => nav.kindGroup === group);

  return (
    <>
      <PageHeader
        title={kind?.name ?? ""}
        parent={parent ? [{ label: parent.label, href: parent.href }] : undefined}
        meta={meta}
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
          <PageLoading />
        ) : !kind ? (
          <PageMessage>找不到這個類型</PageMessage>
        ) : (
          <KindBody kind={kind} />
        )}
      </PageBody>
    </>
  );
}
