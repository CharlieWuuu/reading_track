import Link from "next/link";
import { BookTable } from "@/components/books/BookTable";

export default function BooksPage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">書籍紀錄</h2>
        <Link
          href="/books/new"
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          新增書籍
        </Link>
      </div>
      <BookTable />
    </div>
  );
}
