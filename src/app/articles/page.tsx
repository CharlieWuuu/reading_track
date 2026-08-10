"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { TabBar } from "@/components/ui/Controls";
import { TagList } from "@/components/ui/TagBadge";
import { InstapaperBookmark } from "@/lib/instapaper/client";
import { instapaperReadUrl } from "@/lib/instapaper/readUrl";
import { useArticles } from "@/lib/useArticles";
import { useMounted } from "@/lib/useMounted";
import { useUrlParams } from "@/lib/useUrlParam";
import { useInstapaperStore } from "@/store/useInstapaperStore";

function formatDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleDateString("zh-TW");
}

function activityTime(a: InstapaperBookmark): number {
  return a.progress_timestamp || a.time;
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** 讀到 90% 以上就當作讀完：Instapaper 的進度很少剛好停在 100% */
const DONE_AT = 0.9;

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "done", label: "完讀" },
  { key: "reading", label: "未完讀" },
] as const;

type Filter = (typeof FILTERS)[number]["key"];

function ArticlesList() {
  const { token } = useInstapaperStore();
  const mounted = useMounted();
  const { articles: allArticles, isLoading, error } = useArticles();
  const { searchParams, setParams } = useUrlParams();
  const param = searchParams.get("filter");
  const filter: Filter = FILTERS.some((f) => f.key === param) ? (param as Filter) : "all";
  const setFilter = (next: Filter) => setParams({ filter: next === "all" ? null : next });
  const articles = allArticles.filter((a) =>
    filter === "done"
      ? (a.progress ?? 0) >= DONE_AT
      : filter === "reading"
        ? (a.progress ?? 0) < DONE_AT
        : true,
  );
  const tabs = <TabBar items={FILTERS} value={filter} onChange={setFilter} />;
  if (!mounted) return null;

  if (!token) {
    return (
      <>
        <PageHeader title="文章紀錄" />
        <PageMessage>請先到「設定」頁面連接 Instapaper</PageMessage>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="文章紀錄" />
        <PageMessage>載入中…</PageMessage>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="文章紀錄" />
        <PageMessage tone="error">{error}</PageMessage>
      </>
    );
  }

  if (articles.length === 0) {
    return (
      <>
        <PageHeader title="文章紀錄" action={tabs} />
        <PageMessage>符合條件的文章是空的</PageMessage>
      </>
    );
  }

  return (
    <>
      <PageHeader title="文章紀錄" action={tabs} />
      <PageBody>
        {/* overflow-hidden：hover 底色才會被圓角裁掉，不會在頭尾兩列破圖 */}
        {/* shrink-0：overflow 一旦不是 visible，flex 子項就會被壓扁，清單長了也捲不到 */}
        {/* 桌機只捲清單本身，外框與圓角留在原地；手機仍是整頁捲 */}
        <div className="shrink-0 divide-y overflow-hidden rounded-lg border bg-white md:min-h-0 md:flex-1 md:overflow-y-auto">
          {articles.map((a) => {
            const percent = Math.round((a.progress ?? 0) * 100);
            return (
              <a
                key={a.bookmark_id}
                href={instapaperReadUrl(a.bookmark_id, a.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 sm:gap-4 sm:px-4 sm:py-3"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate text-sm font-medium whitespace-nowrap">
                    {a.title || a.url}
                  </p>
                  {/*
                  日期、網站與標籤同一列；手機寬度不夠時標籤會換到下一行，
                  硬擠在同一行只會被裁掉看不到。
                */}
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="shrink-0 truncate text-xs text-gray-500">
                      {formatDate(activityTime(a))} · {hostname(a.url)}
                    </span>
                    <span className="shrink-0 text-xs text-gray-400 tabular-nums sm:hidden">
                      {percent}%
                    </span>
                    {a.tags && a.tags.length > 0 && (
                      <div className="min-w-0 overflow-hidden">
                        <TagList values={a.tags.map((tag) => tag.name)} tone="article" wrap={false} />
                      </div>
                    )}
                  </div>
                </div>

                {/* 進度靠右，跟標題同一列；手機空間不夠，只在後設資料那行顯示百分比 */}
                <div className="hidden w-32 shrink-0 items-center gap-2 sm:flex">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gray-900"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-xs whitespace-nowrap text-gray-400 tabular-nums">
                    {percent}%
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </PageBody>
    </>
  );
}

/** 底下讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function ArticlesPage() {
  return (
    <Suspense fallback={null}>
      <ArticlesList />
    </Suspense>
  );
}
