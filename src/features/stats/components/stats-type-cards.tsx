"use client";

import Link from "next/link";
import { BookOpen, ChartPie, Newspaper, PenLine, Tag } from "lucide-react";
import { useKinds } from "@/hooks/use-kinds";
import { statsOfModules } from "@/utils/stats/from-modules";

/**
 * 每一種類型各一張卡，點進去才是圖表。
 *
 * 原本進 /stats 直接被導去書籍圖表，類型只能靠頁首那顆選單切換——手機上那顆
 * 選單縮成純圖示，第一次進來根本看不出還有其他幾種可以看。改成卡片牆。
 *
 * 清單是「我在用哪些類型」，不是寫死的四個：開一種新的就自己出現。
 * 卡片上那行小字也是算出來的——列出它真的畫得出哪幾張圖。
 *
 * 設定頁的「統計」分頁也是這一份：手機的底部導覽只放得下五格，統計是回頭看的
 * 東西不是每天要點的，入口收進設定，畫面共用同一支元件。
 */

const ICON = { size: 24, strokeWidth: 1.5 } as const;

const SLUG_ICONS: Record<string, () => React.ReactElement> = {
  books: () => <BookOpen {...ICON} />,
  articles: () => <Newspaper {...ICON} />,
  keywords: () => <Tag {...ICON} />,
};

const GROUP_ICONS: Record<string, () => React.ReactElement> = {
  records: () => <BookOpen {...ICON} />,
  fragments: () => <Tag {...ICON} />,
  writings: () => <PenLine {...ICON} />,
};

export function StatsTypeCards() {
  const { kinds } = useKinds();

  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:p-6">
      {kinds.map((kind) => {
        const Icon =
          SLUG_ICONS[kind.slug] ?? GROUP_ICONS[kind.group] ?? (() => <ChartPie {...ICON} />);
        const charts = statsOfModules(
          kind.modules.map((module) => module.key),
          Object.fromEntries(kind.modules.map((module) => [module.key, module.label])),
        );
        // 沒有任何圖的類型就只有基本數字，那句話比列一串空的誠實
        const hint = charts.length
          ? charts.map((chart) => chart.label).join("、")
          : "筆數與每月節奏";

        return (
          <Link
            key={kind.id}
            href={`/stats/${kind.slug}`}
            className="rounded-surface border-rule-strong flex items-center gap-4 border p-5 transition hover:bg-gray-50"
          >
            <span className="text-accent shrink-0">
              <Icon />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-item font-serif font-semibold">{kind.name}</span>
              <span className="text-meta text-ink-faint truncate">{hint}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
