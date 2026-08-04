import Link from "next/link";
import { Suspense } from "react";
import { BookTable } from "@/components/books/BookTable";
import { BookViewToggle } from "@/components/books/BookViewToggle";
import { PageHeader } from "@/components/layout/PageHeader";

export default function BooksPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-3 md:gap-5">
      <PageHeader
        title="書籍紀錄"
        action={
          <div className="flex items-center gap-2">
            {/* 這兩塊都讀網址參數，靜態預先產生時要有 Suspense 邊界 */}
            <Suspense fallback={null}>
              <BookViewToggle />
            </Suspense>
            <Link
              href="/books/new"
              className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 md:px-4 md:py-2"
            >
              新增書籍
            </Link>
          </div>
        }
      />
      <Suspense fallback={null}>
        <BookTable />
      </Suspense>
    </div>
  );
}
