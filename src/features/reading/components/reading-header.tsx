"use client";

import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ActionButton, SelectMenu } from "@/components/ui/controls";
import { SearchButton } from "@/components/ui/search-button";
import { useUrlParams } from "@/hooks/use-url-param";

/**
 * 閱讀底下五個分頁共用的頁首。
 *
 * 資料層是幾張不同的表（書有封面出版社，文章沒有，佳句單字各自一張），
 * 但它們都是「讀了什麼、從裡面留下什麼」，回顧時本來就是同一件事。
 *
 * 這裡不是 layout.tsx：五條是兄弟路由，中間沒有共同路段可以掛；
 * 而 /reading 那層的 layout 會連單筆頁也套上分頁列，那不是單筆頁要的。
 *
 * 五個分頁收成一顆「類型」選單而不是排成一列：手機放不下五格，擠出畫面
 * 就再也點不到了。省下來的寬度給搜尋框常駐。
 */
const TABS = [
  { key: "books", label: "書籍" },
  { key: "articles", label: "文章" },
  { key: "quotes", label: "佳句" },
  { key: "vocabulary", label: "單字" },
  { key: "keywords", label: "關鍵字" },
] as const;

type Tab = (typeof TABS)[number]["key"];

/** 佳句單字關鍵字是從書裡摘出來的，不單獨新增 */
const NEW_HREF: Partial<Record<Tab, string>> = {
  books: "/reading/books/new",
  articles: "/reading/articles/new",
};

type ReadingHeaderProps = {
  /** 這一頁有幾種看法時放進來（BookViewMenu、KeywordViewMenu）；頁首不該認得任何一個 feature */
  views?: React.ReactNode;
};

export function ReadingHeader({ views }: ReadingHeaderProps = {}) {
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
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <SearchButton
            alwaysOpen
            value={query}
            onChange={(next) => setParams({ q: next || null })}
          />
          <SelectMenu
            label="類型"
            items={TABS}
            value={current}
            onChange={(next) => router.push(`/reading/${next}`)}
          />
          {views}
          {/* 按鈕只放一個加號：旁邊的類型已經說了現在在看書籍還是文章 */}
          {newHref && (
            <ActionButton href={newHref} label="新增">
              <Plus size={16} strokeWidth={2} aria-hidden />
            </ActionButton>
          )}
        </div>
      }
    />
  );
}
