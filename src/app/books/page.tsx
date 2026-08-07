import Link from "next/link";
import { Suspense } from "react";
import { BookTable } from "@/components/books/BookTable";
import { BookViewToggle } from "@/components/books/BookViewToggle";
import { PageShell } from "@/components/layout/PageShell";

export default function BooksPage() {
  return (
    <PageShell
      title="書籍紀錄"
      width="full"
      fill
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
    >
      <Suspense fallback={null}>
        <BookTable />
      </Suspense>
    </PageShell>
  );
}
