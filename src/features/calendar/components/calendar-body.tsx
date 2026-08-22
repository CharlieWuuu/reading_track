"use client";

import { CalendarDays, GanttChartSquare } from "lucide-react";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { MonthGrid } from "@/features/calendar/components/month-grid";
import { ReadingTimeline } from "@/features/calendar/components/reading-timeline";
import { useArticles } from "@/hooks/use-articles";
import { useBooks } from "@/hooks/use-books";
import { useMounted } from "@/hooks/use-mounted";
import { useUrlParams } from "@/hooks/use-url-param";
import { useSheetStore } from "@/stores/use-sheet-store";

/** 月曆看「哪一天讀完」，時間軸看「一本書讀了多久、同時在讀幾本」 */
const VIEWS = [
  { id: "month", label: "月曆", Icon: CalendarDays },
  { id: "timeline", label: "時間軸", Icon: GanttChartSquare },
] as const;

/** 月曆本體：桌機是自己一頁，手機是統計頁的一個分頁，兩邊共用 */
export function CalendarBody() {
  const { sheetId } = useSheetStore();
  const mounted = useMounted();
  const { books, isLoading, error } = useBooks();
  const { articles } = useArticles();
  const { searchParams, setParams } = useUrlParams();
  const view = searchParams.get("view") === "timeline" ? "timeline" : "month";

  // 檢視切換交給各自的頂列去畫，不另外佔頁首的位置
  const viewToggle = (
    <div className="rounded-control border-rule inline-flex border p-0.5">
      {VIEWS.map((option) => (
        <button
          key={option.id}
          onClick={() => setParams({ view: option.id })}
          aria-pressed={view === option.id}
          aria-label={option.label}
          title={option.label}
          className={`rounded-control p-1.5 ${
            view === option.id ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-900"
          }`}
        >
          <option.Icon size={16} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );

  // 還沒有資料可畫時要顯示的訊息（isLoading 已經扣掉「有舊快取墊著」的情況）
  const message = !mounted
    ? ""
    : error
      ? error
      : !sheetId
        ? "請先到「設定」頁面連接 Google Sheet"
        : "";

  // 訊息框與轉圈圈都跟月曆佔一樣的空間，切換的時候版面不會跳動
  if (message || !mounted) {
    return (
      <PageMessage tone={error ? "error" : "muted"} fill>
        {message}
      </PageMessage>
    );
  }

  if (isLoading) return <PageLoading fill />;

  return view === "timeline" ? (
    <ReadingTimeline books={books} action={viewToggle} />
  ) : (
    <MonthGrid books={books} articles={articles} action={viewToggle} />
  );
}
