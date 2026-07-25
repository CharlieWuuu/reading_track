"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { useInstapaperStore } from "@/store/useInstapaperStore";
import { useArticles } from "@/lib/useArticles";

function formatDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleDateString("zh-TW");
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
          尚無已讀文章
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="文章紀錄" />
      <div className="divide-y rounded-lg border bg-white">
        {articles.map((a) => (
          <a
            key={a.bookmark_id}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 hover:bg-gray-50"
          >
            <p className="text-sm font-medium">{a.title || a.url}</p>
            <p className="mt-1 text-xs text-gray-500">
              {formatDate(a.time)} · {new URL(a.url).hostname}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
