// 由 style-dictionary 產生，不要手改。改 src/styles/tokens/*.json 後跑 npm run tokens

export const TOKENS = {
  "blue-100": "#dce6f1",
  "blue-200": "#cfe0ef",
  "blue-300": "#b9cde2",
  "blue-400": "#a9c2da",
  "blue-600": "#2b5a8e",
  "blue-700": "#24486f",
  "azure-100": "#e2ecf5",
  "azure-300": "#c2d6e6",
  "azure-500": "#4a8ab5",
  "azure-700": "#3d6e92",
  "coral-100": "#f6e0d6",
  "coral-200": "#f0d3c6",
  "coral-300": "#e6c3b4",
  "coral-400": "#dfb4a3",
  "coral-500": "#d97d60",
  "coral-600": "#b85c42",
  "coral-700": "#a85b41",
  "coral-800": "#8f4a33",
  "mint-100": "#dfede7",
  "mint-200": "#d2e5dc",
  "mint-300": "#bbd8cd",
  "mint-350": "#b5d4c8", // 手調的中間階，硬塞進整十階會改到畫面
  "mint-400": "#afcec1",
  "mint-500": "#8fbfae",
  "mint-700": "#3f7a67",
  "mint-800": "#33604f",
  "gold-100": "#f7edcf",
  "gold-200": "#f2e3bc",
  "gold-300": "#e3d2a0",
  "gold-400": "#dcc793",
  "gold-500": "#e8c862",
  "gold-600": "#b07d2b",
  "gold-700": "#8a6d1b",
  "gold-800": "#75591a",
  "sand-50": "#fcfcfb",
  "sand-100": "#f5f1ea",
  "sand-200": "#eae3d8",
  "sand-250": "#e8e0d0", // 手調的中間階，硬塞進整十階會改到畫面
  "sand-300": "#d5cabb",
  "sand-500": "#a2957f",
  "sand-600": "#8b7767",
  "sand-700": "#6f5b4c",
  "sand-800": "#5c4a3d",
  "white": "#ffffff",
  "surface": "#ffffff", // 頁面底色
  "surface-viz": "#fcfcfb", // 圖表畫布，比頁面底色暖一點才分得出圖與頁
  "ink-viz": "#5c4a3d", // 深棕彩度太低會被讀成資料色，所以只當圖上的文字
  "ink-viz-muted": "#6f5b4c",
  "ink-viz-faint": "#8b7767",
  "grid": "#e8e0d0", // 圖表格線；米白太淺當不了資料色，當格線剛好
  "series-1": "#2b5a8e",
  "status-want-bg": "#eae3d8",
  "status-want-ink": "#5c4a3d",
  "status-reading-bg": "#b07d2b",
  "status-reading-ink": "#ffffff",
  "status-done-bg": "#f5f1ea", // 多數狀態給最淡的一階，同色系但幾乎不出聲
  "status-done-ink": "#a2957f",
  "tag-domain-bg": "#dfede7",
  "tag-domain-ink": "#3f7a67",
  "tag-domain-ring": "#bbd8cd", // 次領域用外框版：同色系＝同一件事的粗細兩層
  "tag-platform-bg": "#e2ecf5",
  "tag-platform-ink": "#3d6e92",
  "tag-type-ink": "#a85b41",
  "tag-type-ring": "#e6c3b4",
  "tag-language-bg": "#f7edcf",
  "tag-language-ink": "#8a6d1b",
  "control-ink": "#ffffff",
  "map-label-bg": "rgba(255, 255, 255, 0.9)", // 地名常駐在密集的點上，要半透明白底才讀得到
} as const;

export type TokenName = keyof typeof TOKENS;

export function token(name: TokenName): string {
  return TOKENS[name];
}
