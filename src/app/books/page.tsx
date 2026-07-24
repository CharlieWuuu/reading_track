import { BookForm } from "@/components/books/BookForm";
import { BookTable } from "@/components/books/BookTable";

export default function BooksPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <section>
        <h2 className="mb-3 text-base font-semibold">新增書籍</h2>
        <BookForm />
      </section>
      <section>
        <h2 className="mb-3 text-base font-semibold">書籍清單</h2>
        <BookTable />
      </section>
    </div>
  );
}
