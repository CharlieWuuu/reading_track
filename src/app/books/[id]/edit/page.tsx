"use client";

import { useParams } from "next/navigation";
import { BookForm } from "@/components/books/BookForm";
import { BookFormTabs } from "@/components/books/BookFormTabs";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { RecordGate } from "@/components/layout/RecordGate";
import { useBooks } from "@/lib/useBooks";
import { useUrlParams } from "@/lib/useUrlParam";

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
