"use client";

import { Suspense } from "react";
import { ReflectionTimeline } from "@/features/notes/components/reflection-timeline";
import { WritingHeader } from "@/features/writing/components/writing-header";
import { WritingList } from "@/features/writing/components/writing-list";
import { journalToReflections } from "@/utils/reflections";

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function WritingPage() {
  return (
    <Suspense fallback={null}>
      <WritingHeader />
      <WritingList
        // 沒寫心得的也要看得到，所以 requireNote 給 false
        timeline={(writings) => (
          <ReflectionTimeline reflections={journalToReflections(writings, false)} />
        )}
      />
    </Suspense>
  );
}
