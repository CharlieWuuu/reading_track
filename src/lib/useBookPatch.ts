"use client";

import { useBooks } from "@/lib/useBooks";
import { useSheetStore } from "@/store/useSheetStore";
import { Book } from "@/types/book";

/**
 * 單字、佳句、心得都是書的欄位，從各自的頁面改回去走的是同一條路：
 * PATCH 那本書的那一欄，然後重讀書單。
 */
export function useBookPatch() {
  const { sheetId } = useSheetStore();
  const { mutate } = useBooks();

  return async function patchBook(bookId: string, patch: Partial<Book>) {
    if (!sheetId) throw new Error("請先連接 Google Sheet");
    const res = await fetch(`/api/books/${bookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetId, patch }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "儲存失敗");
    }
    await mutate();
  };
}
