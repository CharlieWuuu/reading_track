import { Suspense } from "react";
import { BookDetailView } from "@/components/books/BookDetailView";

export default function BookDetailPage() {
  // 內容會讀網址參數（back），靜態預先產生時要有 Suspense 邊界
  return (
    <Suspense fallback={null}>
      <BookDetailView />
    </Suspense>
  );
}
