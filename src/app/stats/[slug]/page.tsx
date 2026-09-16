"use client";

import { Suspense, use } from "react";
import { KindStatsView } from "@/app/stats/_lib/kind-stats-view";

/**
 * 任何類型的統計。開「影集」不用新增路由，這一條就接得住。
 *
 * 有哪幾種看法由模組決定（`viewsOfModules`），頁首那顆選單讀的是同一份，
 * 所以選單上出現的每一個這裡都畫得出來。
 */
export default function KindStatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <Suspense fallback={null}>
      <KindStatsView slug={slug} />
    </Suspense>
  );
}
