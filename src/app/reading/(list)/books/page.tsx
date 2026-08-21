"use client";

import { BookTable } from "@/features/books/components/book-table";
import { useMounted } from "@/hooks/use-mounted";

export default function BooksPage() {
  const mounted = useMounted();
  if (!mounted) return null;

  // 表格／書封兩種檢視都在 BookTable 裡，搜尋也是它自己讀網址
  return <BookTable />;
}
