import Link from "next/link";
import { BookTable } from "@/components/books/BookTable";
import { BookViewToggle } from "@/components/books/BookViewToggle";
import { DataIssuesHint } from "@/components/books/DataIssuesHint";
import { PageHeader } from "@/components/layout/PageHeader";

export default function BooksPage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2">
      <PageHeader
        title="書籍紀錄"
        action={
          <div className="flex items-center gap-2">
            <BookViewToggle />
            <Link
              href="/books/new"
              className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 md:px-4 md:py-2"
            >
              新增書籍
            </Link>
          </div>
        }
      />
      <DataIssuesHint />
      <BookTable />
    </div>
  );
}
