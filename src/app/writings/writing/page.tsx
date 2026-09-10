"use client";

import { Suspense } from "react";
import { WritingHeader } from "@/features/writing/components/writing-header";
import { WritingList } from "@/features/writing/components/writing-list";

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function WritingPage() {
  return (
    <Suspense fallback={null}>
      <WritingHeader />
      <WritingList />
    </Suspense>
  );
}
