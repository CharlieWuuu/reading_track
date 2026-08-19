"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { ActionButton, TabBar } from "@/components/ui/controls";
import { SearchButton } from "@/components/ui/search-button";
import { BookTable } from "@/features/books/components/book-table";
import { BookViewToggle } from "@/features/books/components/book-view-toggle";
import { ReadingList } from "@/features/library/components/reading-list";
import { matchesSearch, searchTerms } from "@/lib/search";
import { useArticles } from "@/lib/useArticles";
import { useMounted } from "@/lib/useMounted";
import { useUrlParams } from "@/lib/useUrlParam";
import { isBookViewMode, useBookViewStore } from "@/store/useBookViewStore";

/**
 * 書與文章同一個 tab。
 *
 * 資料層仍然是兩張表（書有封面、出版社、頁數，文章沒有，擠一起會多出一堆空格），
 * 只有介面合併——回顧「這陣子讀了什麼」時，那本來就是同一件事。
 */
const TABS = [
  { key: "book", label: "書籍" },
  { key: "article", label: "文章" },
] as const;

type Tab = (typeof TABS)[number]["key"];

function Library() {
  const mounted = useMounted();
  const { searchParams, setParams } = useUrlParams();
  // 預設書籍：書仍然是這一頁的主角，文章是切過去才看的
  const tab: Tab = searchParams.get("type") === "article" ? "article" : "book";
  const { articles, isLoading, error } = useArticles();
  // 檢視方式跟書籍共用一組狀態：切分頁時看到的排列方式不會突然變
  const { view: savedView } = useBookViewStore();
  const urlView = searchParams.get("view");
  const view = isBookViewMode(urlView) ? urlView : savedView;

  // 書籍那邊的搜尋在 BookTable 裡做，它本來就自己讀網址；這裡只管文章
  const query = searchParams.get("q") ?? "";
  const terms = searchTerms(query);
  const found = articles.filter((a) =>
    matchesSearch(terms, a.title, a.author, a.platform, a.keywords, a.note),
  );

  const action = (
    <div className="flex min-w-0 items-center gap-2">
      <SearchButton value={query} onChange={(next) => setParams({ q: next || null })} />
      <TabBar
        items={TABS}
        value={tab}
        // 換分頁時把書籍檢視的參數清掉，免得帶到文章那邊變成殘留
        onChange={(next) => setParams({ type: next === "book" ? null : next, view: null })}
      />
      <BookViewToggle cardLabel={tab === "book" ? "書封" : "卡片"} />
      {/* 按鈕就寫「新增」：旁邊的分頁已經說了現在在看書籍還是文章 */}
      <ActionButton href={tab === "book" ? "/books/new" : "/articles/new"}>新增</ActionButton>
    </div>
  );

  if (!mounted) return null;

  return (
    <>
      <PageHeader title="閱讀紀錄" action={action} />
      <PageBody>
        {tab === "book" ? (
          // 書籍維持原本的表格／書封兩種檢視，那些排版不該為了合頁被拆掉
          <BookTable />
        ) : isLoading ? (
          <PageMessage>載入中…</PageMessage>
        ) : error ? (
          <PageMessage tone="error">{error}</PageMessage>
        ) : found.length === 0 && terms.length > 0 ? (
          <PageMessage>沒有符合的文章</PageMessage>
        ) : (
          <ReadingList articles={found} view={view} />
        )}
      </PageBody>
    </>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function BooksPage() {
  return (
    <Suspense fallback={null}>
      <Library />
    </Suspense>
  );
}
