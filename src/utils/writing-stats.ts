import { Writing } from "@/types/writing";
import { DistributionSlice, MonthCount } from "@/utils/book-stats";
import { getFieldDistribution, getRecordKpis, getRecordMonthlyTrend } from "@/utils/record-stats";

export function getWritingKpis(writings: Writing[]) {
  return getRecordKpis(writings);
}

export function getWritingMonthlyTrend(writings: Writing[], monthsBack = 24): MonthCount[] {
  return getRecordMonthlyTrend(writings, monthsBack);
}

export function getKindDistribution(writings: Writing[]): DistributionSlice[] {
  return getFieldDistribution(writings, "kind");
}
