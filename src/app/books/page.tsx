import { Suspense } from "react";
import { BookTable } from "@/components/books/BookTable";
import { BookViewToggle } from "@/components/books/BookViewToggle";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionButton } from "@/components/ui/Controls";

export default function BooksPage() {
  return (
    <>
      <PageHeader
        title="書籍紀錄"
        action={
          <div className="flex items-center gap-2">
            {/* 這兩塊都讀網址參數，靜態預先產生時要有 Suspense 邊界 */}
            <Suspense fallback={null}>
              <BookViewToggle />
            </Suspense>
            <ActionButton href="/books/new">新增書籍</ActionButton>
          </div>
        }
      />
      <PageBody>
        <Suspense fallback={null}>
          <BookTable />
        </Suspense>
      </PageBody>
    </>
  );
}
