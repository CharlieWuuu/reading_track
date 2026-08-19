"use client";

import { useParams } from "next/navigation";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { BookForm } from "@/features/books/components/book-form";
import { BookFormTabs } from "@/features/books/components/book-form-tabs";
import { useBooks } from "@/hooks/useBooks";
import { useUrlParams } from "@/hooks/useUrlParam";

export default function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  // 上一頁就是書籍資訊，書單的檢視方式再往下傳，存完才回得到同一個畫面
  const { searchParams } = useUrlParams();
  const back = searchParams.get("back");
  const backHref = `/books/${id}${back ? `?back=${encodeURIComponent(back)}` : ""}`;
  const { books, isLoading, error } = useBooks();
  const book = books.find((b) => b.id === id);

  return (
    <>
      <PageHeader title="編輯書籍" backHref={backHref} action={book && <BookFormTabs />} />
      <PageBody>
        <RecordGate loading={isLoading} error={error} missing={!book && "找不到這本書"}>
          <div className="shrink-0 md:min-h-0 md:flex-1">
            <BookForm key={book?.id} book={book} />
          </div>
        </RecordGate>
      </PageBody>
    </>
  );
}
