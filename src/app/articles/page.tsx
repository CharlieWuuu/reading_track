"use client";

import { Suspense, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { PagerButton } from "@/components/ui/PagerButton";
import { TagList } from "@/components/ui/TagBadge";
import { InstapaperBookmark } from "@/lib/instapaper/client";
import { instapaperReadUrl } from "@/lib/instapaper/readUrl";
import { useArticles } from "@/lib/useArticles";
import { useFitPageSize, useFitRowsByMeasure } from "@/lib/useFitPageSize";
import { useMounted } from "@/lib/useMounted";
import { usePagingMode } from "@/lib/usePagingMode";
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

/** 單筆文章的高度：標題 + 日期一行、進度條在右側；手機的標籤可能換行 */
const ROW_HEIGHT = { mobile: 66, desktop: 60 };

function ArticlesList() {
  const { token } = useInstapaperStore();
  const mounted = useMounted();
  const { articles, isLoading, error } = useArticles();
  const [page, setPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const estimate = useFitPageSize(containerRef, ROW_HEIGHT);
  // 分頁／捲動是整個 app 共用的偏好，文章列表也跟著走
  const { scrolling } = usePagingMode();

  // 有標籤的文章列會變高，純算常數會估太多，渲染後再量一次修正
  const fitPageSize = useFitRowsByMeasure(containerRef, estimate, articles.length, !scrolling);
  const pageSize = scrolling ? Math.max(1, articles.length) : fitPageSize;
  const pageCount = Math.max(1, Math.ceil(articles.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageArticles = articles.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

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
      <div ref={containerRef} className="divide-y overflow-hidden rounded-lg border bg-white">
        {pageArticles.map((a) => {
          const percent = Math.round((a.progress ?? 0) * 100);
          return (
            <a
              key={a.bookmark_id}
              href={instapaperReadUrl(a.bookmark_id, a.url)}
              target="_blank"
              rel="noopener noreferrer"
              data-fit-row
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

        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-4 px-4 py-2">
            <PagerButton
              direction="prev"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              label="上一頁"
            />
            <span className="text-xs whitespace-nowrap text-gray-500">
              第 {currentPage + 1} / {pageCount} 頁
            </span>
            <PagerButton
              direction="next"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={currentPage === pageCount - 1}
              label="下一頁"
            />
          </div>
        )}
      </div>
    </>
  );
}

/** usePagingMode 會讀網址參數，靜態預先產生時要有 Suspense 邊界 */
export default function ArticlesPage() {
  return (
    <Suspense fallback={null}>
      <ArticlesList />
    </Suspense>
  );
}
