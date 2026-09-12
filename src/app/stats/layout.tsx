"use client";

import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import {
  BookOpen,
  CalendarDays,
  ChartPie,
  GanttChartSquare,
  History,
  Map,
  Newspaper,
  PenLine,
  Tag,
} from "lucide-react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { SelectMenu } from "@/components/ui/controls";
import {
  isStatsType,
  resolveView,
  STATS_TYPES,
  statsHref,
  StatsType,
  StatsView,
  viewsFor,
} from "@/config/stats-views";
import { useUrlParams } from "@/hooks/use-url-param";

const ICON = { size: 16, strokeWidth: 1.5 } as const;

/**
 * 圖示留在這裡而不是 config/stats-views.ts：那支是純資料（測試也讀它），
 * 一放 JSX 就得改成 .tsx，還會把 lucide 綁進設定層。
 */
const TYPE_ICONS: Record<StatsType, () => React.ReactElement> = {
  books: () => <BookOpen {...ICON} />,
  articles: () => <Newspaper {...ICON} />,
  writing: () => <PenLine {...ICON} />,
  keywords: () => <Tag {...ICON} />,
};

const VIEW_ICONS: Record<StatsView, () => React.ReactElement> = {
  chart: () => <ChartPie {...ICON} />,
  calendar: () => <CalendarDays {...ICON} />,
  timeline: () => <GanttChartSquare {...ICON} />,
  map: () => <Map {...ICON} />,
  era: () => <History {...ICON} />,
};

/**
 * 統計的頁首：兩顆選單，「看哪一種東西」與「怎麼看」。
 *
 * 類型走路徑、顯示方式走查詢參數——類型換的是資料來源（各自一支 page.tsx），
 * 顯示方式換的只是同一份資料的畫法。
 */
function StatsHeader() {
  const router = useRouter();
  const segment = usePathname().split("/")[2];
  const validSegment = isStatsType(segment);
  // 首頁（/stats，segment 是 undefined）是分類卡片牆，不屬於任何一個類型，
  // 頁首只留標題，不畫「看哪一種／怎麼看」那兩顆選單——沒有當下的類型可以切。
  // useUrlParams 還是要呼叫：hooks 不能依條件跳過，沒用到時值就晾著
  const type = validSegment ? segment : "books";
  const { searchParams } = useUrlParams();
  const view = resolveView(type, searchParams.get("view"));
  const views = viewsFor(type).map((v) => ({ ...v, Icon: VIEW_ICONS[v.key] }));

  if (!validSegment) return <PageHeader title="統計" />;

  const label = STATS_TYPES.find((item) => item.key === type)?.label;

  return (
    <PageHeader
      // 標題是現在看的那一種，「統計」退成麵包屑——不然四頁的頁首長得一模一樣，
      // 也沒有路回卡片牆
      title={label}
      parent={[{ label: "統計", href: "/stats" }]}
      action={
        <div className="flex min-w-0 items-center gap-2">
          <SelectMenu
            label="類型"
            items={STATS_TYPES.map((item) => ({ ...item, Icon: TYPE_ICONS[item.key] }))}
            value={type}
            // 換類型時目前的看法可能不適用，resolveView 會退回圖表
            onChange={(next) => router.push(statsHref(next, resolveView(next, view)))}
          />
          {/* 只有一種看法時那顆選單沒有意義，不畫 */}
          {views.length > 1 && (
            <SelectMenu
              iconOnly
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
