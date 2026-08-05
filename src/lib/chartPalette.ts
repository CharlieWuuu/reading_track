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
  "#B5D4C8", // 薄荷綠
  "#E8C862", // 金黃
  "#4A8AB5", // 柔和藍
  "#5C4A3D", // 深棕
  "#8FBFAE", // 補位：薄荷綠加深
  "#B85C42", // 補位：珊瑚橙加深
];

/**
 * 排行用的單色階（深→淺），從深藍走到柔和藍再到米白。
 * 名次是「量」不是「身分」，所以用同一個色相的深淺，不是八種顏色。
 */
export const SEQUENTIAL = ["#1F4269", "#2B5A8E", "#4A8AB5", "#8FB4D4", "#C9DAE8"];

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
