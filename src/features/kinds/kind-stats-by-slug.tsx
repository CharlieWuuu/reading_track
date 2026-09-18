"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { KindCalendar } from "@/features/calendar/components/kind-calendar";
import { KindTimeline } from "@/features/calendar/components/kind-timeline";
import { KindStats } from "@/features/stats/components/kind-stats";
import { useKinds } from "@/hooks/use-kinds";

/**
 * 用 slug 找類型，再畫它的統計。
 *
 * 書籍與文章那兩支實體頁手上只有 Book[]／Article[]，沒有 Kind——
 * 統計要的是「勾了哪些模組」，那在 kind 身上。通用類型頁自己就有 kind，
 * 直接用 KindStats 即可，不必繞這一層。
 *
 * 住在 features/kinds 而不是 features/stats：月曆與數線要從 features/calendar
 * 傳進 KindStats，而 stats 那一區 import 不到 calendar（eslint 擋）。
 * kinds 不在 feature 區裡，兩邊的交會點就落在這裡。
 */
export function KindStatsBySlug({ slug }: { slug: string }) {
  const { kinds, isLoading } = useKinds();
  const kind = kinds.find((item) => item.slug === slug);

  if (isLoading) return <PageLoading />;
  if (!kind) return <PageMessage>找不到這個類型</PageMessage>;

  return (
    <KindStats
      kind={kind}
      wide={{ calendar: <KindCalendar kind={kind} />, timeline: <KindTimeline kind={kind} /> }}
    />
  );
}
