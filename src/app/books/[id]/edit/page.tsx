"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BookForm } from "@/components/books/BookForm";
import { useSheetStore } from "@/store/useSheetStore";
import { Book } from "@/types/book";

export default function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  const { sheetId } = useSheetStore();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sheetId) {
      setLoading(false);
      return;
    }
    fetch(`/api/books?sheetId=${encodeURIComponent(sheetId)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "讀取失敗");
        const found = (data.books as Book[]).find((b) => b.id === id);
        setBook(found ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "讀取失敗"))
      .finally(() => setLoading(false));
  }, [sheetId, id]);

  if (!sheetId) {
    return (
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-3 text-base font-semibold">編輯書籍</h2>
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          請先到「設定」頁面連接 Google Sheet
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-3 text-base font-semibold">編輯書籍</h2>
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          載入中…
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-3 text-base font-semibold">編輯書籍</h2>
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          {error || "找不到這本書"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-3 text-base font-semibold">編輯書籍</h2>
      <BookForm book={book} />
    </div>
  );
}
