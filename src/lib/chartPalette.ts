/**
 * 圖表配色。
 *
 * 色相取自封面那種「海藍—落日橘—沙金」的調子，但每一階都用資料視覺化的
 * 六項檢查跑過（亮度帶、彩度下限、色盲可辨識度、一般視覺可辨識度、對比），
 * 不是憑感覺挑的——憑感覺挑的柔和色在圓餅圖上會糊成一片。
 *
 * 順序固定，不可循環使用：第 9 個項目要合併成「其他」，不是自己生一個新顏色。
 */
export const CATEGORICAL = [
  "#0e8ba6", // 海藍綠
  "#d5502e", // 落日橘紅
  "#2a78d6", // 藍
  "#c08a10", // 沙金
  "#a34a8f", // 紫紅
  "#2f8f4e", // 綠
  "#7a5bbf", // 紫
  "#d1567f", // 玫瑰
];

/**
 * 排行用的單色階（深→淺）。名次是「量」不是「身分」，
 * 所以用同一個色相的深淺，不是八種顏色。
 */
export const SEQUENTIAL = ["#0b5f73", "#0e7d95", "#2f9cb3", "#6bbccd", "#a5d6e0"];

/** 折線／長條的主色，與 CATEGORICAL 第一階同色 */
export const SERIES_PRIMARY = CATEGORICAL[0];

/** 圖表共用的介面色，寫進 .viz-root 的 CSS 變數 */
export const VIZ_TOKENS = `
  color-scheme: light;
  --surface-1: #fcfcfb;
  --text-primary: #0b0b0b;
  --text-secondary: #52514e;
  --muted: #898781;
  --grid: #e1e0d9;
  --series-1: ${SERIES_PRIMARY};
`;
