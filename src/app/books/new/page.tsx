import { BookForm } from "@/components/books/BookForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewBookPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="新增書籍" />
      <BookForm />
    </div>
  );
}
