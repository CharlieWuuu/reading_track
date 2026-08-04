"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { useSheetStore } from "@/store/useSheetStore";
import { useBooks } from "@/lib/useBooks";
import { useArticles } from "@/lib/useArticles";

export default function CalendarPage() {
  const { sheetId } = useSheetStore();
  const { books, isLoading, error } = useBooks();
  const { articles } = useArticles();

  if (!sheetId) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="日曆" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          請先到「設定」頁面連接 Google Sheet
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="日曆" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          載入中…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="日曆" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
      <PageHeader title="日曆" />
      <MonthGrid books={books} articles={articles} />
    </div>
  );
}
