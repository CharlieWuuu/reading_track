"use client";

import { useParams } from "next/navigation";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { kindHref } from "@/config/kind-routes";
import { bookHref } from "@/config/routes";
import { BookForm } from "@/features/books/components/book-form";
import { BookRefetchButton } from "@/features/books/components/book-refetch-button";
import { useBooks } from "@/hooks/use-books";
import { useUrlParams } from "@/hooks/use-url-param";

export default function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  // 上一頁就是書籍資訊，書單的檢視方式再往下傳，存完才回得到同一個畫面
  const { searchParams } = useUrlParams();
  const back = searchParams.get("back");
  const backHref = bookHref(id, back);
  const { books, isLoading, error } = useBooks();
  const book = books.find((b) => b.id === id);
  // 書名太長時麵包屑只取前五字，不然一長串會把後面的「編輯」擠出畫面
  const bookLabel = book && (book.title.length > 5 ? `${book.title.slice(0, 5)}…` : book.title);

  return (
    <>
      <PageHeader
        title="編輯書籍"
        size="compact"
        parent={[
          { label: "紀錄", href: "/records" },
          { label: "書籍", href: kindHref("records", "books") },
          ...(bookLabel ? [{ label: bookLabel, href: bookHref(id) }] : []),
        ]}
        backHref={backHref}
        action={book && <BookRefetchButton />}
      />
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
