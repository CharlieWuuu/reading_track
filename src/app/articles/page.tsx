"use client";

import Link from "next/link";
import { Suspense } from "react";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { ActionButton, TabBar } from "@/components/ui/Controls";
import { TagList } from "@/components/ui/TagBadge";
import { useArticles } from "@/lib/useArticles";
import { useMounted } from "@/lib/useMounted";
import { useUrlParams } from "@/lib/useUrlParam";
import { Article } from "@/types/article";
import { splitLines, splitTags } from "@/types/book";

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "done", label: "完讀" },
  { key: "pending", label: "未完讀" },
] as const;

type Filter = (typeof FILTERS)[number]["key"];

/** 只有一個日期，有填就是讀完了 */
function isDone(a: Article) {
  return Boolean(a.endDate);
}

function ArticlesList() {
  const mounted = useMounted();
  const { articles: allArticles, isLoading, error } = useArticles();
  const { searchParams, setParams } = useUrlParams();
  const param = searchParams.get("filter");
  const filter: Filter = FILTERS.some((f) => f.key === param) ? (param as Filter) : "all";
  const setFilter = (next: Filter) => setParams({ filter: next === "all" ? null : next });
  const articles = allArticles.filter((a) =>
    filter === "done" ? isDone(a) : filter === "pending" ? !isDone(a) : true,
  );

  const action = (
    <div className="flex items-center gap-2">
      <TabBar items={FILTERS} value={filter} onChange={setFilter} />
      <ActionButton href="/articles/new">新增文章</ActionButton>
    </div>
  );
  if (!mounted) return null;

  if (isLoading) {
    return (
      <>
        <PageHeader title="文章紀錄" action={action} />
        <PageMessage>載入中…</PageMessage>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="文章紀錄" action={action} />
        <PageMessage tone="error">{error}</PageMessage>
      </>
    );
  }

  if (articles.length === 0) {
    return (
      <>
        <PageHeader title="文章紀錄" action={action} />
        <PageMessage>符合條件的文章是空的</PageMessage>
      </>
    );
  }

  return (
    <>
      <PageHeader title="文章紀錄" action={action} />
      <PageBody>
        {/* overflow-hidden：hover 底色才會被圓角裁掉，不會在頭尾兩列破圖 */}
        {/* shrink-0：overflow 一旦不是 visible，flex 子項就會被壓扁，清單長了也捲不到 */}
        {/* 桌機只捲清單本身，外框與圓角留在原地；手機仍是整頁捲 */}
        <div className="shrink-0 divide-y overflow-hidden rounded-lg border bg-white md:min-h-0 md:flex-1 md:overflow-y-auto">
          {articles.map((a) => {
            // 屬性是多值、關鍵字是一行一筆，兩種都當標籤秀
            const tags = [...splitTags(a.type), ...splitLines(a.keywords)];
            return (
              <Link
                key={a.id}
                href={`/articles/${a.id}/edit`}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 sm:gap-4 sm:px-4 sm:py-3"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate text-sm font-medium whitespace-nowrap">{a.title}</p>
                  {/*
                    日期、站台與標籤同一列；手機寬度不夠時標籤會換到下一行，
                    硬擠在同一行只會被裁掉看不到。
                  */}
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="shrink-0 truncate text-xs text-gray-500">
                      {[a.endDate || "未完讀", a.platform, a.author].filter(Boolean).join(" · ")}
                    </span>
                    {tags.length > 0 && (
                      <div className="min-w-0 overflow-hidden">
                        <TagList values={tags} tone="article" wrap={false} />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
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
