"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { kindHref } from "@/config/kind-routes";
import { BookForm } from "@/features/books/components/book-form";
import { BookRefetchButton } from "@/features/books/components/book-refetch-button";
import { useUrlParams } from "@/hooks/use-url-param";

const booksListHref = kindHref("records", "books");

/**
 * 新增書籍：一步到位，直接進表單。
 *
 * 查詢步驟拿掉了——書名跟來源網址本來就是表單的兩個欄位，填了按頁首的
 * 「重新抓取」就會爬資料回來補其餘欄位，不用先跳一頁看查詢結果再確認。
 */
function NewBook() {
  // 從書單進來時帶著檢視方式與頁碼，返回要回到同一頁
  const { searchParams } = useUrlParams();
  const back = searchParams.get("back");
  const backHref = back ? `${booksListHref}?${back}` : booksListHref;

  return (
    <>
      <PageHeader
        title="新增書籍"
        size="compact"
        backHref={backHref}
        action={<BookRefetchButton />}
      />
      <PageBody>
        <div className="shrink-0 md:min-h-0 md:flex-1">
          <BookForm initial={{}} />
        </div>
      </PageBody>
    </>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function NewBookPage() {
  return (
    <Suspense fallback={null}>
      <NewBook />
    </Suspense>
  );
}
