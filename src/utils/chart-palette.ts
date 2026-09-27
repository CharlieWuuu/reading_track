import { TOKENS } from "@/styles/generated/tokens";

/**
 * 圖表配色：綠 → 沙 → 天空（設計稿定的順序），前三個就是語意色票 series-1～3。
 *
 * 之後同三色輪一次深的、再一次淺的——色相先分得開，深淺再來分。
 * 沙與天空對白底對比不足，所以圖上一律保留直接標示的數值與名稱，不靠顏色本身讀資料。
 *
 * 順序固定，不可循環使用：第 9 個項目要合併成「其他」，用 SERIES_OVERFLOW，
 * 不是回頭拿第 1 個色。
 */
export const CATEGORICAL = [
  TOKENS["series-1"], // 仙人掌綠
  TOKENS["series-2"], // 沙丘
  TOKENS["series-3"], // 天空
  TOKENS["cactus-900"],
  TOKENS["dune-700"],
  TOKENS["sky-700"],
  TOKENS["cactus-300"],
  TOKENS["dune-300"],
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
