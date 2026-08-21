"use client";

import { usePathname, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ActionButton, TabBar } from "@/components/ui/controls";
import { SearchButton } from "@/components/ui/search-button";
import { BookViewToggle } from "@/features/reading/components/book-view-toggle";
import { useUrlParams } from "@/hooks/use-url-param";

/**
 * 閱讀底下五個分頁共用的頁首。
 *
 * 資料層是幾張不同的表（書有封面出版社，文章沒有，佳句單字各自一張），
 * 但它們都是「讀了什麼、從裡面留下什麼」，回顧時本來就是同一件事。
 *
 * 這裡不是 layout.tsx：五條是兄弟路由，中間沒有共同路段可以掛；
 * 而 /reading 那層的 layout 會連單筆頁也套上分頁列，那不是單筆頁要的。
 */
const TABS = [
  { key: "books", label: "書籍" },
  { key: "articles", label: "文章" },
  { key: "quotes", label: "佳句" },
  { key: "vocabulary", label: "單字" },
  { key: "keywords", label: "關鍵字" },
] as const;

type Tab = (typeof TABS)[number]["key"];

/** 只有清單看得到書封／卡片切換與新增按鈕；佳句單字關鍵字是從書裡摘出來的，不單獨新增 */
const NEW_HREF: Partial<Record<Tab, string>> = {
  books: "/reading/books/new",
  articles: "/reading/articles/new",
};

/** 關鍵字那頁有四種看法，選單內容由那一頁給——頁首不該認識任何一個 feature 的內部 */
type ReadingHeaderProps = {
  menu?: {
    items: ReadonlyArray<{ key: string; label: string }>;
    value: string;
    onChange: (next: string) => void;
  };
};

export function ReadingHeader({ menu }: ReadingHeaderProps = {}) {
  const router = useRouter();
  const segment = usePathname().split("/")[2];
  // 在哪一個分頁看網址就知道，不用各頁再傳一次
  const current = (TABS.some((t) => t.key === segment) ? segment : "books") as Tab;
  const { searchParams, setParams } = useUrlParams();
  const query = searchParams.get("q") ?? "";

  const newHref = NEW_HREF[current];

  return (
    <PageHeader
      title="閱讀"
      action={
        <div className="flex min-w-0 items-center gap-2">
          <SearchButton value={query} onChange={(next) => setParams({ q: next || null })} />
          <TabBar
            items={TABS}
            value={current}
            // 換分頁時把看法清掉，下次點關鍵字一律從卡片開始
            onChange={(next) => router.push(`/reading/${next}`)}
            // 關鍵字有四種看法，點分頁就把選單放下來，不另外佔一列
            menu={menu && { for: "keywords", ...menu }}
          />
          {newHref && <BookViewToggle cardLabel={current === "books" ? "書封" : "卡片"} />}
          {/* 按鈕就寫「新增」：旁邊的分頁已經說了現在在看書籍還是文章 */}
          {newHref && <ActionButton href={newHref}>新增</ActionButton>}
        </div>
      }
    />
  );
}
