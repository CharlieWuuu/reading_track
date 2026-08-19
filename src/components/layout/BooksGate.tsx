"use client";

import { PageMessage } from "@/components/layout/PageMessage";
import { useBooks } from "@/hooks/useBooks";
import { useMounted } from "@/hooks/useMounted";
import { useSheetStore } from "@/store/useSheetStore";
import { Book } from "@/types/book";

type BooksGateProps = {
  children: (books: Book[]) => React.ReactNode;
};

/** 每個吃書籍資料的頁面都要先過這四關，寫四次不如寫一次 */
export function BooksGate({ children }: BooksGateProps) {
  const { sheetId } = useSheetStore();
  const mounted = useMounted();
  const { books, isLoading, error } = useBooks();

  // 還沒掛載完就什麼都別說，免得閃一下「請先連接」
  if (!mounted) return null;
  if (!sheetId) return <PageMessage>請先到「設定」頁面連接 Google Sheet</PageMessage>;
  if (isLoading) return <PageMessage>載入中…</PageMessage>;
  if (error) return <PageMessage tone="error">{error}</PageMessage>;

  return <>{children(books)}</>;
}
