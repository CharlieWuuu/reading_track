"use client";

import { useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useFitPageSize } from "@/lib/useFitPageSize";
import { useInstapaperStore } from "@/store/useInstapaperStore";
import { useArticles } from "@/lib/useArticles";
import { InstapaperBookmark } from "@/lib/instapaper/client";
import { instapaperReadUrl } from "@/lib/instapaper/readUrl";

function formatDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleDateString("zh-TW");
}

function activityTime(a: InstapaperBookmark): number {
  return a.progress_timestamp || a.time;
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

/** 單筆文章的高度：標題 + 日期 + 進度條 */
const ROW_HEIGHT = { mobile: 92, desktop: 84 };

export default function ArticlesPage() {
  const { token } = useInstapaperStore();
  const { articles, isLoading, error } = useArticles();
  const [page, setPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageSize = useFitPageSize(containerRef, ROW_HEIGHT);

  const pageCount = Math.max(1, Math.ceil(articles.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageArticles = articles.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize
  );

  if (!token) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="文章紀錄" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          請先到「設定」頁面連接 Instapaper
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="文章紀錄" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          載入中…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="文章紀錄" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="文章紀錄" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          尚無文章
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="文章紀錄" />
      <div ref={containerRef} className="divide-y rounded-lg border bg-white">
        {pageArticles.map((a) => {
          const percent = Math.round((a.progress ?? 0) * 100);
          return (
            <a
              key={a.bookmark_id}
              href={instapaperReadUrl(a.bookmark_id, a.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-3 hover:bg-gray-50 sm:px-4"
            >
              <div className="flex min-w-0 items-center justify-between gap-3">
                <p className="min-w-0 flex-1 truncate whitespace-nowrap text-sm font-medium">
                  {a.title || a.url}
                </p>
                <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-gray-400">
                  {percent}%
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-gray-500">
                {formatDate(activityTime(a))} · {hostname(a.url)}
              </p>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gray-900"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </a>
          );
        })}

        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-4 px-4 py-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              aria-label="上一頁"
              className="text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-400"
            >
              ‹
            </button>
            <span className="whitespace-nowrap text-xs text-gray-500">
              第 {currentPage + 1} / {pageCount} 頁
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={currentPage === pageCount - 1}
              aria-label="下一頁"
              className="text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-400"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
