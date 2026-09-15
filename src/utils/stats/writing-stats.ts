import { Writing } from "@/types/writing";
import { DistributionSlice, MonthCount } from "@/utils/stats/book-stats";
import {
  getFieldDistribution,
  getRecordKpis,
  getRecordMonthlyTrend,
  type DatedRecord,
} from "@/utils/stats/record-stats";

/** 書寫的日期欄叫「完成日」，統計那邊一律看 date——跟文章同一套 */
type WritingRecord = Omit<Writing, "endDate"> & DatedRecord;

function toRecords(writings: Writing[]): WritingRecord[] {
  return writings.map(({ endDate, ...rest }) => ({ ...rest, date: endDate }));
}

export function getWritingKpis(writings: Writing[]) {
  return getRecordKpis(toRecords(writings));
}

export function getWritingMonthlyTrend(writings: Writing[], monthsBack = 24): MonthCount[] {
  return getRecordMonthlyTrend(toRecords(writings), monthsBack);
}

export function getTopicDistribution(writings: Writing[]): DistributionSlice[] {
  return getFieldDistribution(toRecords(writings), "topic");
}
