import { itemsInRange } from "@/utils/date-range";
import { IsoWeek, isoWeekRange } from "@/utils/iso-week";

/** 週報是「一週長的日期範圍」，篩選邏輯跟年報、日報共用同一支 itemsInRange */
export function itemsInWeek<
  T extends { endDate?: string | null; startDate?: string | null; createdAt: string },
>(rows: readonly T[], week: IsoWeek): T[] {
  return itemsInRange(rows, isoWeekRange(week));
}
