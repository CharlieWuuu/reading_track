import { Suspense } from "react";
import { CalendarBody } from "@/features/calendar/components/calendar-body";

/** 月曆用 ?view= 記住看法，讀網址參數的元件要有 Suspense 邊界才預先產生得了 */
export default function CalendarStatsPage() {
  return (
    <Suspense fallback={null}>
      <CalendarBody />
    </Suspense>
  );
}
