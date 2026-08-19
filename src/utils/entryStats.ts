import { Entry } from "@/types/entry";
import { DistributionSlice, MonthCount } from "@/utils/bookStats";
import { getFieldDistribution, getRecordKpis, getRecordMonthlyTrend } from "@/utils/recordStats";

export function getEntryKpis(entries: Entry[]) {
  return getRecordKpis(entries);
}

export function getEntryMonthlyTrend(entries: Entry[], monthsBack = 24): MonthCount[] {
  return getRecordMonthlyTrend(entries, monthsBack);
}

export function getKindDistribution(entries: Entry[]): DistributionSlice[] {
  return getFieldDistribution(entries, "kind");
}
