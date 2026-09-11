"use client";

import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ActionButton } from "@/components/ui/controls";
import { SearchBar } from "@/components/ui/search-bar";
import { kindGroupSlugFromPath } from "@/config/kind-routes";
import { NAV_GROUPS } from "@/config/nav";
import { READING_TABS, ReadingTab, readingTabHref } from "@/config/tabs";
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
 * 手機不放類型切換：那是堆概覽頁（/records、/fragments）頁首那排 tab 在做的事，
 * 單一類型頁只講自己這一種。省下來的寬度給搜尋框常駐。
 */

/** 佳句單字關鍵字是從書裡摘出來的，不單獨新增 */
const NEW_HREF: Partial<Record<ReadingTab, string>> = {
  books: `${readingTabHref("books")}/new`,
  articles: `${readingTabHref("articles")}/new`,
};

type ReadingHeaderProps = {
  /** 搜尋框右邊、views 左邊的插槽——表格才有意義的操作放這裡（BookEditModeButton） */
  beforeViews?: React.ReactNode;
  /** 這一頁有幾種看法時放進來（BookViewMenu、KeywordViewMenu）；頁首不該認得任何一個 feature */
  views?: React.ReactNode;
  /** 這一頁有東西可以篩的時候放進來（BookStatusMenu） */
  filters?: React.ReactNode;
  /** 新增不是換頁而是跳彈窗的那幾頁，自己把按鈕傳進來 */
  newButton?: React.ReactNode;
  /** 標題旁邊那行小字，各頁自己算好傳進來（例如書籍頁的「312 本・在讀 3」） */
  meta?: React.ReactNode;
};

export function ReadingHeader({
  beforeViews,
  views,
  filters,
  newButton,
  meta,
}: ReadingHeaderProps = {}) {
  const pathname = usePathname();
  // 在哪一個分頁看網址就知道，不用各頁再傳一次——收斂過的類型看 [slug]，其餘看 /reading/<tab>
  const segment = kindGroupSlugFromPath(pathname)?.slug ?? pathname.split("/")[2];
  const current = (READING_TABS.some((t) => t.key === segment) ? segment : "books") as ReadingTab;
  const { searchParams, setParams } = useUrlParams();
  const query = searchParams.get("q") ?? "";

  const newHref = NEW_HREF[current];
  const currentTab = READING_TABS.find((tab) => tab.key === current);
  // 麵包屑：這個分頁掛在側欄哪一堆底下，字跟側欄同一份設定，不重複維護
  const parent = NAV_GROUPS.find((group) => group.kindGroup === currentTab?.group)?.label;

  return (
    <PageHeader
      title={currentTab?.label}
      parent={parent}
      meta={meta}
      action={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2 md:flex-nowrap">
          <SearchBar value={query} onChange={(next) => setParams({ q: next || null })} />
          {beforeViews}
          {views}
          {filters}
          {/* 按鈕只放一個加號：旁邊的類型已經說了現在在看書籍還是文章 */}
          {newButton ??
            (newHref && (
              <ActionButton href={newHref} label="新增" text="新增">
                <Plus size={16} strokeWidth={2} aria-hidden />
              </ActionButton>
            ))}
        </div>
      }
    />
  );
}
