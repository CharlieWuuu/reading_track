"use client";

import { useParams } from "next/navigation";
import { BookForm } from "@/components/books/BookForm";
import { useSheetStore } from "@/store/useSheetStore";
import { useBooks } from "@/lib/useBooks";
import { PageMessage, PageShell } from "@/components/layout/PageShell";

export default function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  const { sheetId } = useSheetStore();
  const { books, isLoading, error } = useBooks();
  const book = books.find((b) => b.id === id);

  if (!sheetId || isLoading || error || !book) {
    return (
      <PageShell title="編輯書籍">
        <PageMessage tone={error ? "error" : "muted"}>
          {!sheetId
            ? "請先到「設定」頁面連接 Google Sheet"
            : isLoading
              ? "載入中…"
              : error || "找不到這本書"}
        </PageMessage>
      </PageShell>
    );
  }

  return (
    <PageShell title="編輯書籍" fill>
      <div className="min-h-0 flex-1">
        <BookForm key={book.id} book={book} />
      </div>
    </PageShell>
  );
}
