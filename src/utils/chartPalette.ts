import { TOKENS } from "@/styles/generated/tokens";

/**
 * 圖表配色 —— 直接使用品牌色票。
 *
 * 米白與深棕不進資料色（一個太淺、一個彩度太低會被讀成灰），改當介面色：
 * 米白是格線、深棕是文字。薄荷綠與金黃對白底的對比偏低（1.5–1.6:1），
 * 所以圖上一律保留直接標示的數值與名稱，不靠顏色本身讀資料。
 *
 * 順序固定，不可循環使用：第 9 個項目要合併成「其他」，用 SERIES_OVERFLOW，
 * 不是回頭拿第 1 個色。
 */
export const CATEGORICAL = [
  TOKENS["blue-600"], // 深藍
  TOKENS["coral-500"], // 珊瑚橙
  TOKENS["mint-500"], // 薄荷綠（加深）——深的排前面，淺的那階疊字會看不清楚
  TOKENS["gold-500"], // 金黃
  TOKENS["azure-500"], // 柔和藍
  TOKENS["sand-800"], // 深棕
  TOKENS["coral-600"], // 珊瑚橙（加深）
  TOKENS["mint-350"], // 薄荷綠（原色，最淺，排最後）
];

/**
 * 排行的長條色。刻意全部同一階：名次的深淺會暗示「差距」，
 * 但同分的項目也會被畫成不同深淺，反而讀成假的差異。長度本身就是量。
 */
export const SEQUENTIAL = [TOKENS["series-1"]];

/** 折線／長條的主色，與 CATEGORICAL 第一階同色 */
export const SERIES_PRIMARY = TOKENS["series-1"];

/** 超出 CATEGORICAL 的項目合併成「其他」時用的灰 */
export const SERIES_OVERFLOW = TOKENS["series-overflow"];
