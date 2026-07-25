"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { useInstapaperStore } from "@/store/useInstapaperStore";
import { useArticles } from "@/lib/useArticles";
import { InstapaperBookmark } from "@/lib/instapaper/client";

function formatDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleDateString("zh-TW");
}

function activityTime(a: InstapaperBookmark): number {
  return a.progress_timestamp || a.time;
}

export default function ArticlesPage() {
  const { token } = useInstapaperStore();
  const { articles, isLoading, error } = useArticles();

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
      <div className="divide-y rounded-lg border bg-white">
        {articles.map((a) => {
          const percent = Math.round((a.progress ?? 0) * 100);
          return (
            <a
              key={a.bookmark_id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="truncate text-sm font-medium">{a.title || a.url}</p>
                <span className="shrink-0 text-xs tabular-nums text-gray-400">
                  {percent}%
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {formatDate(activityTime(a))} · {new URL(a.url).hostname}
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
      </div>
    </div>
  );
}
