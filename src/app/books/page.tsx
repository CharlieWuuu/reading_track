import Link from "next/link";
import { BookTable } from "@/components/books/BookTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function BooksPage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title="書籍紀錄"
        action={
          <Link
            href="/books/new"
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            新增書籍
          </Link>
        }
      />
      <BookTable />
    </div>
  );
}
