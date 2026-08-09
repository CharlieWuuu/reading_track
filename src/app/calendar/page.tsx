"use client";

import { Suspense } from "react";
import { CalendarBody } from "@/components/calendar/CalendarBody";
import { PageHeader } from "@/components/layout/PageHeader";

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <PageHeader title="月曆" />
      <CalendarBody />
    </Suspense>
  );
}
