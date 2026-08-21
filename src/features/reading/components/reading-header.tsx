"use client";

import { usePathname, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ActionButton, TabBar } from "@/components/ui/controls";
import { SearchButton } from "@/components/ui/search-button";
import { BookViewToggle } from "@/features/reading/components/book-view-toggle";
import { useUrlParams } from "@/hooks/use-url-param";

/**
 * 書與文章共用的頁首。
 *
 * 資料層是兩張表（書有封面、出版社、頁數，文章沒有），但回顧「這陣子讀了什麼」時
 * 那是同一件事，所以兩條路由共用同一列分頁與工具。
 *
 * 這裡不是 layout.tsx：`/books` 與 `/articles` 是兄弟路由，中間沒有共同的路段可以掛。
 */
const TABS = [
  { key: "book", label: "書籍" },
  { key: "article", label: "文章" },
] as const;

type Tab = (typeof TABS)[number]["key"];

const HREF: Record<Tab, string> = { book: "/reading/books", article: "/reading/articles" };

export function ReadingHeader() {
  const router = useRouter();
  // 在哪一個分頁看網址就知道，不用各頁再傳一次
  const current: Tab = usePathname().startsWith("/reading/articles") ? "article" : "book";
  const { searchParams, setParams } = useUrlParams();
  const query = searchParams.get("q") ?? "";

  return (
    <PageHeader
      title="閱讀"
      action={
        <div className="flex min-w-0 items-center gap-2">
          <SearchButton value={query} onChange={(next) => setParams({ q: next || null })} />
          <TabBar items={TABS} value={current} onChange={(next) => router.push(HREF[next])} />
          <BookViewToggle cardLabel={current === "book" ? "書封" : "卡片"} />
          {/* 按鈕就寫「新增」：旁邊的分頁已經說了現在在看書籍還是文章 */}
          <ActionButton href={current === "book" ? "/reading/books/new" : "/reading/articles/new"}>
            新增
          </ActionButton>
        </div>
      }
    />
  );
}
