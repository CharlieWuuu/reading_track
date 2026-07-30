"use client";

import { useParams } from "next/navigation";
import { BookForm } from "@/components/books/BookForm";
import { useSheetStore } from "@/store/useSheetStore";
import { useBooks } from "@/lib/useBooks";
import { PageHeader } from "@/components/layout/PageHeader";

export default function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  const { sheetId } = useSheetStore();
  const { books, isLoading, error } = useBooks();
  const book = books.find((b) => b.id === id);

  if (!sheetId) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="編輯書籍" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          請先到「設定」頁面連接 Google Sheet
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="編輯書籍" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          載入中…
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="編輯書籍" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          {error || "找不到這本書"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-5xl flex-col">
      <PageHeader title="編輯書籍" />
      <div className="min-h-0 flex-1">
        <BookForm key={book.id} book={book} />
      </div>
    </div>
  );
}
