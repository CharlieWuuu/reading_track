"use client";

import { Suspense, use } from "react";
import { PageMessage } from "@/components/layout/page-message";
import { KindStats } from "@/features/stats/components/kind-stats";
import { useKinds } from "@/hooks/use-kinds";

/**
 * 任何類型的統計圖表。開「影集」不用新增路由，這一條就接得住。
 *
 * 只畫圖表：月曆與數線還綁著各自的型別（MonthGrid 的格子按書／文章／書寫
 * 各有一套樣式），那幾種看法留在 /stats/books 那些實體頁，等它們也通用了再收。
 */
function KindStatsView({ slug }: { slug: string }) {
  const { kinds, isLoading } = useKinds();
  const kind = kinds.find((item) => item.slug === slug);

  if (isLoading) return null;
  if (!kind) return <PageMessage>找不到這個類型</PageMessage>;
  return <KindStats kind={kind} />;
}

export default function KindStatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <Suspense fallback={null}>
      <KindStatsView slug={slug} />
    </Suspense>
  );
}
