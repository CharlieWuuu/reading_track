import { BookForm } from "@/components/books/BookForm";

export default function NewBookPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-3 text-base font-semibold">新增書籍</h2>
      <BookForm />
    </div>
  );
}
