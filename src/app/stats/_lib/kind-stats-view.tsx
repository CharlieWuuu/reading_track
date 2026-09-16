"use client";

import { PageMessage } from "@/components/layout/page-message";
import { KindCalendar } from "@/features/calendar/components/kind-calendar";
import { KindTimeline } from "@/features/calendar/components/kind-timeline";
import { KindStats } from "@/features/stats/components/kind-stats";
import { useKinds } from "@/hooks/use-kinds";
import { useUrlParams } from "@/hooks/use-url-param";
import type { Kind } from "@/lib/db/queries/kinds";
import { viewsOfModules } from "@/utils/stats/from-modules";

/**
 * 一種類型的統計：圖表、月曆或數線，看網址上的 ?view=。
 *
 * 在 app 這層分岔而不是收進 features：eslint 的邊界擋 `features/stats`
 * import `features/calendar`，app 才是它們的交會處。
 *
 * 地圖與年代還沒進來——那兩種只有關鍵字畫得出來（要經緯度、要起訖年），
 * 留在 /stats/keywords 那支實體頁，等第二個類型也勾了座標再抽。
 */
const RENDER: Record<string, (kind: Kind) => React.ReactElement> = {
  calendar: (kind) => <KindCalendar kind={kind} />,
  timeline: (kind) => <KindTimeline kind={kind} />,
};

export function KindStatsView({ slug }: { slug: string }) {
  const { kinds, isLoading } = useKinds();
  const { searchParams } = useUrlParams();
  const kind = kinds.find((item) => item.slug === slug);

  if (isLoading) return null;
  if (!kind) return <PageMessage>找不到這個類型</PageMessage>;

  // 網址上的 ?view= 不適用於這個類型時退回圖表，而不是畫一片空白
  const allowed = viewsOfModules(kind.modules.map((m) => m.key));
  const view = allowed.find((item) => item === searchParams.get("view")) ?? "chart";

  return RENDER[view]?.(kind) ?? <KindStats kind={kind} />;
}
