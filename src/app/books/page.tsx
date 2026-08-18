"use client";

import { Suspense } from "react";
import { BookTable } from "@/components/books/BookTable";
import { BookViewToggle } from "@/components/books/BookViewToggle";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { ReadingList, toReadingItems } from "@/components/library/ReadingList";
import { ActionButton, TabBar } from "@/components/ui/Controls";
import { useArticles } from "@/lib/useArticles";
import { useBooks } from "@/lib/useBooks";
import { useMounted } from "@/lib/useMounted";
import { useUrlParams } from "@/lib/useUrlParam";

/**
 * 書與文章同一個 tab。
 *
 * 資料層仍然是兩張表（書有封面、出版社、頁數，文章沒有，擠一起會多出一堆空格），
 * 只有介面合併——回顧「這陣子讀了什麼」時，那本來就是同一件事。
 */
const TABS = [
  { key: "all", label: "全部" },
  { key: "book", label: "書籍" },
  { key: "article", label: "文章" },
] as const;

type Tab = (typeof TABS)[number]["key"];

const NEW_HREF: Record<Tab, { href: string; label: string }> = {
  // 「全部」時預設新增書籍：想記文章的話切過去那一頁就好
  all: { href: "/books/new", label: "新增書籍" },
  book: { href: "/books/new", label: "新增書籍" },
  article: { href: "/articles/new", label: "新增文章" },
};

function Library() {
  const mounted = useMounted();
  const { searchParams, setParams } = useUrlParams();
  const param = searchParams.get("type");
  const tab: Tab = TABS.some((t) => t.key === param) ? (param as Tab) : "all";

  const { books, isLoading: loadingBooks, error: bookError } = useBooks();
  const { articles, isLoading: loadingArticles, error: articleError } = useArticles();

  const add = NEW_HREF[tab];
  const action = (
    <div className="flex min-w-0 items-center gap-2">
      <TabBar
        items={TABS}
        value={tab}
        // 換分頁時把書籍檢視的參數清掉，免得帶到文章那邊變成殘留
        onChange={(next) => setParams({ type: next === "all" ? null : next, view: null })}
      />
      {tab === "book" && <BookViewToggle />}
      <ActionButton href={add.href}>{add.label}</ActionButton>
    </div>
  );

  if (!mounted) return null;

  // 書籍那一頁維持原本的表格／書封兩種檢視，那些排版不該為了合頁被拆掉
  if (tab === "book") {
    return (
      <>
        <PageHeader title="閱讀紀錄" action={action} />
        <PageBody>
          <BookTable />
        </PageBody>
      </>
    );
  }

  const isLoading = loadingBooks || loadingArticles;
  const error = bookError || articleError;
  const items = toReadingItems(tab === "article" ? [] : books, articles);

  return (
    <>
      <PageHeader title="閱讀紀錄" action={action} />
      <PageBody>
        {isLoading ? (
          <PageMessage>載入中…</PageMessage>
        ) : error ? (
          <PageMessage tone="error">{error}</PageMessage>
        ) : (
          <ReadingList items={items} />
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
