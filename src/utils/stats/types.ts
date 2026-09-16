/**
 * 圖表元件吃的形狀。放這裡不放 book-stats：書籍已經跟文章、紀事走同一套，
 * 型別卻掛在「書籍」底下的話，下一個人會以為只有書籍能用。
 */

export interface YearCount {
  year: string;
  count: number;
}

export interface MonthCount {
  month: string;
  count: number;
}

export interface QuarterCount {
  quarter: string;
  count: number;
}

export interface DistributionSlice {
  name: string;
  value: number;
}

/** 兩層的分布：大格子是上層（領域），children 是它底下的細分 */
export interface DistributionGroup {
  name: string;
  children: DistributionSlice[];
}

/** 排行榜的一列。coverUrl 給重讀排行放封面用，其餘留空 */
export interface RankingItem {
  name: string;
  value: number;
  coverUrl?: string;
}
