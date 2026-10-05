import { useState } from "react";
import { isSameMonth, shiftMonth, yearMonthOf } from "@/features/calendar/utils/month-shift";

// 月曆看哪個月。放在月曆外面一層：換月鈕在卡片標題列，格子在卡片裡，兩邊要讀同一份
export function useMonthNav() {
  const [current, setCurrent] = useState(() => yearMonthOf(new Date()));
  const atCurrentMonth = isSameMonth(current, yearMonthOf(new Date())); // 未來的月份沒紀錄，不給翻
  return {
    ...current,
    atCurrentMonth,
    prev: () => setCurrent((c) => shiftMonth(c, -1)),
    next: () => setCurrent((c) => shiftMonth(c, 1)),
  };
}

export type MonthNavState = ReturnType<typeof useMonthNav>;
