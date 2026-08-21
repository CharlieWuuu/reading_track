import { JournalEntry } from "@/types/journal";
import { DistributionSlice, MonthCount } from "@/utils/book-stats";
import { getFieldDistribution, getRecordKpis, getRecordMonthlyTrend } from "@/utils/record-stats";

export function getJournalKpis(journal: JournalEntry[]) {
  return getRecordKpis(journal);
}

export function getJournalMonthlyTrend(journal: JournalEntry[], monthsBack = 24): MonthCount[] {
  return getRecordMonthlyTrend(journal, monthsBack);
}

export function getKindDistribution(journal: JournalEntry[]): DistributionSlice[] {
  return getFieldDistribution(journal, "kind");
}
