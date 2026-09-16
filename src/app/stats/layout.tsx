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
import { STATS_VIEWS, StatsView } from "@/config/stats-views";
import { useKinds } from "@/hooks/use-kinds";
import { useUrlParams } from "@/hooks/use-url-param";
import { viewsOfModules } from "@/utils/stats/from-modules";

const ICON = { size: 16, strokeWidth: 1.5 } as const;

/**
 * 圖示留在這裡而不是 config/stats-views.ts：那支是純資料（測試也讀它），
 * 一放 JSX 就得改成 .tsx，還會把 lucide 綁進設定層。
 */
/**
 * 類型的圖示。認得的用自己的，其餘照 group 給一個——自訂類型隨時會多，
 * 每加一種就要來這裡補一行的話，那又是一張寫死的清單。
 */
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

const iconOf = (kind: { slug: string; group: string }) =>
  SLUG_ICONS[kind.slug] ?? GROUP_ICONS[kind.group] ?? (() => <ChartPie {...ICON} />);

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
  const { kinds } = useKinds();
  const { searchParams } = useUrlParams();

  // 類型清單就是「我在用哪些」，不是寫死的四個——開一種新的就自己出現在選單裡
  const items = kinds.map((kind) => ({
    key: kind.slug,
    label: kind.name,
    Icon: iconOf(kind),
  }));
  const current = kinds.find((kind) => kind.slug === segment);

  const allowed = viewsOfModules(current?.modules.map((m) => m.key) ?? []);
  const raw = searchParams.get("view");
  const view = allowed.find((item) => item === raw) ?? "chart";
  const views = allowed
    .map((key) => STATS_VIEWS.find((v) => v.key === key))
    .filter((v) => v !== undefined)
    .map((v) => ({ ...v, Icon: VIEW_ICONS[v.key] }));

  // 首頁（/stats）是卡片牆，不屬於任何類型，沒有當下的類型可以切
  if (!current) return <PageHeader title="統計" />;

  const label = current.name;
  const hrefOf = (slug: string, next: string) =>
    next === "chart" ? `/stats/${slug}` : `/stats/${slug}?view=${next}`;

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
            items={items}
            value={current.slug}
            // 換類型時目前的看法可能不適用，一律回圖表——每個類型都有圖表
            onChange={(next) => router.push(`/stats/${next}`)}
          />
          {/* 只有一種看法時那顆選單沒有意義，不畫 */}
          {views.length > 1 && (
            <SelectMenu
              iconOnly
              label="顯示方式"
              items={views}
              value={view}
              onChange={(next) => router.push(hrefOf(current.slug, next))}
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
