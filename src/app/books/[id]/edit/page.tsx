"use client";

import { useParams } from "next/navigation";
import { BookForm } from "@/components/books/BookForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { useBooks } from "@/lib/useBooks";
import { useSheetStore } from "@/store/useSheetStore";

export default function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  const { sheetId } = useSheetStore();
  const { books, isLoading, error } = useBooks();
  const book = books.find((b) => b.id === id);

  if (!sheetId || isLoading || error || !book) {
    return (
      <>
        <PageHeader title="編輯書籍" />
        <PageMessage tone={error ? "error" : "muted"}>
          {!sheetId
            ? "請先到「設定」頁面連接 Google Sheet"
            : isLoading
              ? "載入中…"
              : error || "找不到這本書"}
        </PageMessage>
      </>
    );
  }

  return (
    <>
      <PageHeader title="編輯書籍" />
      <div className="min-h-0 flex-1">
        <BookForm key={book.id} book={book} />
      </div>
    </>
  );
}
