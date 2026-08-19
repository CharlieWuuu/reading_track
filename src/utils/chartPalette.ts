/**
 * 圖表配色 —— 直接使用品牌色票。
 *
 * 米白與深棕不進資料色（一個太淺、一個彩度太低會被讀成灰），改當介面色：
 * 米白是格線、深棕是文字。薄荷綠與金黃對白底的對比偏低（1.5–1.6:1），
 * 所以圖上一律保留直接標示的數值與名稱，不靠顏色本身讀資料。
 *
 * 順序固定，不可循環使用：第 9 個項目要合併成「其他」，不是自己生一個新顏色。
 */
export const CATEGORICAL = [
  "#2B5A8E", // 深藍
  "#D97D60", // 珊瑚橙
  "#8FBFAE", // 薄荷綠（加深）——深的排前面，淺的那階疊字會看不清楚
  "#E8C862", // 金黃
  "#4A8AB5", // 柔和藍
  "#5C4A3D", // 深棕
  "#B85C42", // 珊瑚橙（加深）
  "#B5D4C8", // 薄荷綠（原色，最淺，排最後）
];

/**
 * 排行的長條色。刻意全部同一階：名次的深淺會暗示「差距」，
 * 但同分的項目也會被畫成不同深淺，反而讀成假的差異。長度本身就是量。
 */
export const SEQUENTIAL = ["#2B5A8E"];

/** 折線／長條的主色，與 CATEGORICAL 第一階同色 */
export const SERIES_PRIMARY = CATEGORICAL[0];

/** 圖表共用的介面色，寫進 .viz-root 的 CSS 變數 */
export const VIZ_TOKENS = `
  color-scheme: light;
  --surface-1: #fcfcfb;
  --text-primary: #5C4A3D;
  --text-secondary: #6f5b4c;
  --muted: #8b7767;
  --grid: #E8E0D0;
  --series-1: ${SERIES_PRIMARY};
`;
