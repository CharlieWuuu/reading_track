import { Article } from "@/types/article";
import { DistributionSlice, MonthCount } from "@/utils/book-stats";
import {
  getFieldDistribution,
  getRecordKpis,
  getRecordMonthlyTrend,
  type DatedRecord,
} from "@/utils/record-stats";

/** 文章的日期欄叫「閱讀日期」，統計那邊一律看 date */
type ArticleRecord = Omit<Article, "endDate"> & DatedRecord;

function toRecords(articles: Article[]): ArticleRecord[] {
  return articles.map(({ endDate, ...rest }) => ({ ...rest, date: endDate }));
}

export function getArticleKpis(articles: Article[]) {
  return getRecordKpis(toRecords(articles));
}

export function getArticleMonthlyTrend(articles: Article[], monthsBack = 24): MonthCount[] {
  return getRecordMonthlyTrend(toRecords(articles), monthsBack);
}

/** 站台排行：只算讀完的，還沒讀完的站不會上榜 */
export function getSourceRanking(articles: Article[], limit = 8): DistributionSlice[] {
  return getFieldDistribution(toRecords(articles), "platform", { limit, includeBlank: false });
}

export function getArticleDomainDistribution(articles: Article[]): DistributionSlice[] {
  return getFieldDistribution(toRecords(articles), "domain");
}

export function getArticleTypeDistribution(articles: Article[]): DistributionSlice[] {
  return getFieldDistribution(toRecords(articles), "type");
}
