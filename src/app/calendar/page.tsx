"use client";

import { Suspense } from "react";
import { CalendarDays, GanttChartSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { ReadingTimeline } from "@/components/calendar/ReadingTimeline";
import { useUrlParams } from "@/lib/useUrlParam";
import { useSheetStore } from "@/store/useSheetStore";
import { useMounted } from "@/lib/useMounted";
import { useBooks } from "@/lib/useBooks";
import { useArticles } from "@/lib/useArticles";

/** 月曆看「哪一天讀完」，時間軸看「一本書讀了多久、同時在讀幾本」 */
const VIEWS = [
  { id: "month", label: "月曆", Icon: CalendarDays },
  { id: "timeline", label: "時間軸", Icon: GanttChartSquare },
] as const;

function CalendarViews() {
  const { sheetId } = useSheetStore();
  const mounted = useMounted();
  const { books, isLoading, error } = useBooks();
  const { articles } = useArticles();
  const { searchParams, setParams } = useUrlParams();
  const view = searchParams.get("view") === "timeline" ? "timeline" : "month";

  if (!mounted) return null;

  if (!sheetId) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="月曆" />
        <div className="w-full rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          請先到「設定」頁面連接 Google Sheet
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="月曆" />
        <div className="w-full rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          載入中…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="月曆" />
        <div className="w-full rounded-lg border bg-white p-8 text-center text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  // 檢視切換交給各自的頂列去畫，不另外佔頁首的位置
  const viewToggle = (
    <div className="inline-flex rounded border border-gray-300 p-0.5">
      {VIEWS.map((option) => (
        <button
          key={option.id}
          onClick={() => setParams({ view: option.id })}
          aria-pressed={view === option.id}
          aria-label={option.label}
          title={option.label}
          className={`rounded p-1.5 ${
            view === option.id ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-900"
          }`}
        >
          <option.Icon size={16} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-3 md:gap-5">
      <PageHeader title="月曆" />
      {view === "timeline" ? (
        <ReadingTimeline books={books} action={viewToggle} />
      ) : (
        <MonthGrid books={books} articles={articles} action={viewToggle} />
      )}
    </div>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <CalendarViews />
    </Suspense>
  );
}
