"use client";

import { useParams } from "next/navigation";
import { BookForm } from "@/components/books/BookForm";
import { useBookStore } from "@/store/useBookStore";

export default function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  const book = useBookStore((s) => s.books.find((b) => b.id === id));

  if (!book) {
    return (
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-3 text-base font-semibold">編輯書籍</h2>
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          找不到這本書
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
