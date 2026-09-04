"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { useBooks } from "@/hooks/use-books";
import { useMounted } from "@/hooks/use-mounted";
import { Book } from "@/types/book";

type BooksGateProps = {
  children: (books: Book[]) => React.ReactNode;
};

/** 每個吃書籍資料的頁面都要先過這三關，寫三次不如寫一次 */
export function BooksGate({ children }: BooksGateProps) {
  const mounted = useMounted();
  const { books, isLoading, error } = useBooks();

  // 還沒掛載完就什麼都別說，免得閃一下
  if (!mounted) return null;
  if (isLoading) return <PageLoading />;
  if (error)
    return (
      <PageMessage tone="error" fill>
        {error}
      </PageMessage>
    );

  return <>{children(books)}</>;
}
