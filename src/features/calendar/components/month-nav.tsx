import { PagerButton } from "@/components/ui/pager-button";
import type { MonthNavState } from "@/features/calendar/hooks/use-month-nav";

// 換月鈕：‹ 2026 年 10 月 ›。跟格子分開，擺哪裡由呼叫端決定
export function MonthNav({ nav }: { nav: MonthNavState }) {
  return (
    <div className="flex items-center gap-2">
      <PagerButton direction="prev" onClick={nav.prev} label="上個月" />
      <span className="w-22 text-center text-sm font-medium whitespace-nowrap">
        {nav.year} 年 {nav.month + 1} 月
      </span>
      <PagerButton
        direction="next"
        onClick={nav.next}
        disabled={nav.atCurrentMonth}
        label="下個月"
      />
    </div>
  );
}
