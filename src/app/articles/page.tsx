"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { TagList } from "@/components/ui/TagBadge";
import { InstapaperBookmark } from "@/lib/instapaper/client";
import { instapaperReadUrl } from "@/lib/instapaper/readUrl";
import { useArticles } from "@/lib/useArticles";
import { useMounted } from "@/lib/useMounted";
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

function ArticlesList() {
  const { token } = useInstapaperStore();
  const mounted = useMounted();
  const { articles, isLoading, error } = useArticles();
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
        <PageHeader title="文章紀錄" />
        <PageMessage>尚無文章</PageMessage>
      </>
    );
  }

  return (
    <>
      <PageHeader title="文章紀錄" />
      {/* overflow-hidden：hover 底色才會被圓角裁掉，不會在頭尾兩列破圖 */}
      <div className="divide-y overflow-hidden rounded-lg border bg-white">
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
                <p className="truncate text-sm font-medium whitespace-nowrap">{a.title || a.url}</p>
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
                      <TagList values={a.tags.map((tag) => tag.name)} wrap={false} />
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
