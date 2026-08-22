// 由 style-dictionary 產生，不要手改。改 src/styles/tokens/*.json 後跑 npm run tokens

export type TokenLayer = "primitive" | "semantic" | "component";

export interface TokenEntry {
  name: string;
  layer: TokenLayer;
  value: string;
  alias: string | null;
  description: string | null;
}

export const TOKEN_MANIFEST: TokenEntry[] = [
  {
    "name": "color-blue-100",
    "layer": "primitive",
    "value": "#dce6f1",
    "alias": null,
    "description": null
  },
  {
    "name": "color-blue-200",
    "layer": "primitive",
    "value": "#cfe0ef",
    "alias": null,
    "description": null
  },
  {
    "name": "color-blue-300",
    "layer": "primitive",
    "value": "#b9cde2",
    "alias": null,
    "description": null
  },
  {
    "name": "color-blue-400",
    "layer": "primitive",
    "value": "#a9c2da",
    "alias": null,
    "description": null
  },
  {
    "name": "color-blue-600",
    "layer": "primitive",
    "value": "#2b5a8e",
    "alias": null,
    "description": null
  },
  {
    "name": "color-blue-700",
    "layer": "primitive",
    "value": "#24486f",
    "alias": null,
    "description": null
  },
  {
    "name": "color-azure-100",
    "layer": "primitive",
    "value": "#e2ecf5",
    "alias": null,
    "description": null
  },
  {
    "name": "color-azure-300",
    "layer": "primitive",
    "value": "#c2d6e6",
    "alias": null,
    "description": null
  },
  {
    "name": "color-azure-500",
    "layer": "primitive",
    "value": "#4a8ab5",
    "alias": null,
    "description": null
  },
  {
    "name": "color-azure-700",
    "layer": "primitive",
    "value": "#3d6e92",
    "alias": null,
    "description": null
  },
  {
    "name": "color-coral-100",
    "layer": "primitive",
    "value": "#f6e0d6",
    "alias": null,
    "description": null
  },
  {
    "name": "color-coral-200",
    "layer": "primitive",
    "value": "#f0d3c6",
    "alias": null,
    "description": null
  },
  {
    "name": "color-coral-300",
    "layer": "primitive",
    "value": "#e6c3b4",
    "alias": null,
    "description": null
  },
  {
    "name": "color-coral-400",
    "layer": "primitive",
    "value": "#dfb4a3",
    "alias": null,
    "description": null
  },
  {
    "name": "color-coral-500",
    "layer": "primitive",
    "value": "#d97d60",
    "alias": null,
    "description": null
  },
  {
    "name": "color-coral-600",
    "layer": "primitive",
    "value": "#b85c42",
    "alias": null,
    "description": null
  },
  {
    "name": "color-coral-700",
    "layer": "primitive",
    "value": "#a85b41",
    "alias": null,
    "description": null
  },
  {
    "name": "color-coral-800",
    "layer": "primitive",
    "value": "#8f4a33",
    "alias": null,
    "description": null
  },
  {
    "name": "color-mint-100",
    "layer": "primitive",
    "value": "#dfede7",
    "alias": null,
    "description": null
  },
  {
    "name": "color-mint-200",
    "layer": "primitive",
    "value": "#d2e5dc",
    "alias": null,
    "description": null
  },
  {
    "name": "color-mint-300",
    "layer": "primitive",
    "value": "#bbd8cd",
    "alias": null,
    "description": null
  },
  {
    "name": "color-mint-350",
    "layer": "primitive",
    "value": "#b5d4c8",
    "alias": null,
    "description": "手調的中間階，硬塞進整十階會改到畫面"
  },
  {
    "name": "color-mint-400",
    "layer": "primitive",
    "value": "#afcec1",
    "alias": null,
    "description": null
  },
  {
    "name": "color-mint-500",
    "layer": "primitive",
    "value": "#8fbfae",
    "alias": null,
    "description": null
  },
  {
    "name": "color-mint-700",
    "layer": "primitive",
    "value": "#3f7a67",
    "alias": null,
    "description": null
  },
  {
    "name": "color-mint-800",
    "layer": "primitive",
    "value": "#33604f",
    "alias": null,
    "description": null
  },
  {
    "name": "color-gold-100",
    "layer": "primitive",
    "value": "#f7edcf",
    "alias": null,
    "description": null
  },
  {
    "name": "color-gold-200",
    "layer": "primitive",
    "value": "#f2e3bc",
    "alias": null,
    "description": null
  },
  {
    "name": "color-gold-300",
    "layer": "primitive",
    "value": "#e3d2a0",
    "alias": null,
    "description": null
  },
  {
    "name": "color-gold-400",
    "layer": "primitive",
    "value": "#dcc793",
    "alias": null,
    "description": null
  },
  {
    "name": "color-gold-500",
    "layer": "primitive",
    "value": "#e8c862",
    "alias": null,
    "description": null
  },
  {
    "name": "color-gold-600",
    "layer": "primitive",
    "value": "#b07d2b",
    "alias": null,
    "description": null
  },
  {
    "name": "color-gold-700",
    "layer": "primitive",
    "value": "#8a6d1b",
    "alias": null,
    "description": null
  },
  {
    "name": "color-gold-800",
    "layer": "primitive",
    "value": "#75591a",
    "alias": null,
    "description": null
  },
  {
    "name": "color-sand-50",
    "layer": "primitive",
    "value": "#fcfcfb",
    "alias": null,
    "description": null
  },
  {
    "name": "color-sand-100",
    "layer": "primitive",
    "value": "#f5f1ea",
    "alias": null,
    "description": null
  },
  {
    "name": "color-sand-200",
    "layer": "primitive",
    "value": "#eae3d8",
    "alias": null,
    "description": null
  },
  {
    "name": "color-sand-250",
    "layer": "primitive",
    "value": "#e8e0d0",
    "alias": null,
    "description": "手調的中間階，硬塞進整十階會改到畫面"
  },
  {
    "name": "color-sand-300",
    "layer": "primitive",
    "value": "#d5cabb",
    "alias": null,
    "description": null
  },
  {
    "name": "color-sand-500",
    "layer": "primitive",
    "value": "#a2957f",
    "alias": null,
    "description": null
  },
  {
    "name": "color-sand-600",
    "layer": "primitive",
    "value": "#8b7767",
    "alias": null,
    "description": null
  },
  {
    "name": "color-sand-700",
    "layer": "primitive",
    "value": "#6f5b4c",
    "alias": null,
    "description": null
  },
  {
    "name": "color-sand-800",
    "layer": "primitive",
    "value": "#5c4a3d",
    "alias": null,
    "description": null
  },
  {
    "name": "color-white",
    "layer": "primitive",
    "value": "#ffffff",
    "alias": null,
    "description": null
  },
  {
    "name": "color-surface",
    "layer": "semantic",
    "value": "#ffffff",
    "alias": "white",
    "description": "頁面底色"
  },
  {
    "name": "color-surface-sunken",
    "layer": "semantic",
    "value": "var(--color-gray-50)",
    "alias": null,
    "description": null
  },
  {
    "name": "color-surface-viz",
    "layer": "semantic",
    "value": "#fcfcfb",
    "alias": "sand.50",
    "description": "圖表畫布，比頁面底色暖一點才分得出圖與頁"
  },
  {
    "name": "color-ink",
    "layer": "semantic",
    "value": "var(--color-gray-900)",
    "alias": null,
    "description": null
  },
  {
    "name": "color-ink-muted",
    "layer": "semantic",
    "value": "var(--color-gray-500)",
    "alias": null,
    "description": null
  },
  {
    "name": "color-ink-faint",
    "layer": "semantic",
    "value": "var(--color-gray-400)",
    "alias": null,
    "description": null
  },
  {
    "name": "color-ink-viz",
    "layer": "semantic",
    "value": "#5c4a3d",
    "alias": "sand.800",
    "description": "深棕彩度太低會被讀成資料色，所以只當圖上的文字"
  },
  {
    "name": "color-ink-viz-muted",
    "layer": "semantic",
    "value": "#6f5b4c",
    "alias": "sand.700",
    "description": null
  },
  {
    "name": "color-ink-viz-faint",
    "layer": "semantic",
    "value": "#8b7767",
    "alias": "sand.600",
    "description": null
  },
  {
    "name": "color-rule",
    "layer": "semantic",
    "value": "#e8e0d0",
    "alias": "sand.250",
    "description": "框線與底色同一支色系才像一套；原本的冷灰配米白底會偏藍，且對白底 1.47:1 太搶"
  },
  {
    "name": "color-rule-soft",
    "layer": "semantic",
    "value": "#eae3d8",
    "alias": "sand.200",
    "description": "同一塊裡分列用；rule 是「這是兩個東西」，這一階是「同一件事的下一行」"
  },
  {
    "name": "color-rule-strong",
    "layer": "semantic",
    "value": "#5c4a3d",
    "alias": "sand.800",
    "description": "外殼邊界（側欄、底部導覽）與強調框；純黑改成深棕，跟其餘的框同色系"
  },
  {
    "name": "color-grid",
    "layer": "semantic",
    "value": "#e8e0d0",
    "alias": "sand.250",
    "description": "圖表格線；米白太淺當不了資料色，當格線剛好"
  },
  {
    "name": "color-series-1",
    "layer": "semantic",
    "value": "#2b5a8e",
    "alias": "blue.600",
    "description": null
  },
  {
    "name": "color-series-overflow",
    "layer": "semantic",
    "value": "#9ca3af",
    "alias": null,
    "description": "第 9 個以後合併成「其他」的那一格，不是第 9 個色；值同 Tailwind gray-400，但 recharts 要字面值"
  },
  {
    "name": "color-status-want-bg",
    "layer": "semantic",
    "value": "#eae3d8",
    "alias": "sand.200",
    "description": null
  },
  {
    "name": "color-status-want-ink",
    "layer": "semantic",
    "value": "#5c4a3d",
    "alias": "sand.800",
    "description": null
  },
  {
    "name": "color-status-reading-bg",
    "layer": "semantic",
    "value": "#b07d2b",
    "alias": "gold.600",
    "description": null
  },
  {
    "name": "color-status-reading-ink",
    "layer": "semantic",
    "value": "#ffffff",
    "alias": "white",
    "description": null
  },
  {
    "name": "color-status-done-bg",
    "layer": "semantic",
    "value": "#f5f1ea",
    "alias": "sand.100",
    "description": "多數狀態給最淡的一階，同色系但幾乎不出聲"
  },
  {
    "name": "color-status-done-ink",
    "layer": "semantic",
    "value": "#a2957f",
    "alias": "sand.500",
    "description": null
  },
  {
    "name": "color-tag-domain-bg",
    "layer": "semantic",
    "value": "#dfede7",
    "alias": "mint.100",
    "description": null
  },
  {
    "name": "color-tag-domain-ink",
    "layer": "semantic",
    "value": "#3f7a67",
    "alias": "mint.700",
    "description": null
  },
  {
    "name": "color-tag-domain-ring",
    "layer": "semantic",
    "value": "#bbd8cd",
    "alias": "mint.300",
    "description": "次領域用外框版：同色系＝同一件事的粗細兩層"
  },
  {
    "name": "color-tag-platform-bg",
    "layer": "semantic",
    "value": "#e2ecf5",
    "alias": "azure.100",
    "description": null
  },
  {
    "name": "color-tag-platform-ink",
    "layer": "semantic",
    "value": "#3d6e92",
    "alias": "azure.700",
    "description": null
  },
  {
    "name": "color-tag-type-ink",
    "layer": "semantic",
    "value": "#a85b41",
    "alias": "coral.700",
    "description": null
  },
  {
    "name": "color-tag-type-ring",
    "layer": "semantic",
    "value": "#e6c3b4",
    "alias": "coral.300",
    "description": null
  },
  {
    "name": "color-tag-language-bg",
    "layer": "semantic",
    "value": "#f7edcf",
    "alias": "gold.100",
    "description": null
  },
  {
    "name": "color-tag-language-ink",
    "layer": "semantic",
    "value": "#8a6d1b",
    "alias": "gold.700",
    "description": null
  },
  {
    "name": "color-tag-article-bg",
    "layer": "semantic",
    "value": "var(--color-gray-100)",
    "alias": null,
    "description": null
  },
  {
    "name": "color-tag-article-ink",
    "layer": "semantic",
    "value": "var(--color-gray-500)",
    "alias": null,
    "description": "文章標籤是自由打的，沒有固定選項可配色，整組同一個中性色"
  },
  {
    "name": "color-control-bg",
    "layer": "component",
    "value": "var(--color-gray-900)",
    "alias": null,
    "description": null
  },
  {
    "name": "color-control-bg-hover",
    "layer": "component",
    "value": "var(--color-gray-700)",
    "alias": null,
    "description": null
  },
  {
    "name": "color-control-ink",
    "layer": "component",
    "value": "#ffffff",
    "alias": "white",
    "description": null
  },
  {
    "name": "color-control-ink-idle",
    "layer": "component",
    "value": "var(--color-gray-500)",
    "alias": "ink-muted",
    "description": "分頁列沒選中的那幾格"
  },
  {
    "name": "color-control-ink-secondary",
    "layer": "component",
    "value": "var(--color-gray-600)",
    "alias": null,
    "description": "次要按鈕的字：比 ink-idle 深一階，它是可按的、不是沒選中的"
  },
  {
    "name": "color-control-ink-faint",
    "layer": "component",
    "value": "var(--color-gray-400)",
    "alias": "ink-faint",
    "description": null
  },
  {
    "name": "color-control-ink-faint-hover",
    "layer": "component",
    "value": "var(--color-gray-700)",
    "alias": null,
    "description": null
  },
  {
    "name": "color-control-border",
    "layer": "component",
    "value": "#e8e0d0",
    "alias": "rule",
    "description": null
  },
  {
    "name": "color-control-ghost-hover",
    "layer": "component",
    "value": "var(--color-gray-100)",
    "alias": null,
    "description": null
  },
  {
    "name": "color-control-menu-bg",
    "layer": "component",
    "value": "#ffffff",
    "alias": "surface",
    "description": null
  },
  {
    "name": "color-control-menu-hover",
    "layer": "component",
    "value": "var(--color-gray-50)",
    "alias": "surface-sunken",
    "description": null
  },
  {
    "name": "color-table-header-bg",
    "layer": "component",
    "value": "var(--color-gray-100)",
    "alias": null,
    "description": null
  },
  {
    "name": "color-table-header-rule",
    "layer": "component",
    "value": "#5c4a3d",
    "alias": "rule-strong",
    "description": "表頭下緣用 inset shadow 畫，sticky 時 border 會被捲掉"
  },
  {
    "name": "color-map-label-bg",
    "layer": "component",
    "value": "rgba(255, 255, 255, 0.9)",
    "alias": null,
    "description": "地名常駐在密集的點上，要半透明白底才讀得到"
  },
  {
    "name": "color-map-label-ink",
    "layer": "component",
    "value": "var(--color-gray-700)",
    "alias": null,
    "description": null
  },
  {
    "name": "color-map-chrome-border",
    "layer": "component",
    "value": "#e8e0d0",
    "alias": "rule",
    "description": null
  },
  {
    "name": "color-map-chrome-disabled",
    "layer": "component",
    "value": "var(--color-gray-50)",
    "alias": null,
    "description": null
  },
  {
    "name": "color-map-attribution-ink",
    "layer": "component",
    "value": "var(--color-gray-400)",
    "alias": null,
    "description": null
  },
  {
    "name": "color-map-attribution-link",
    "layer": "component",
    "value": "var(--color-gray-500)",
    "alias": null,
    "description": null
  },
  {
    "name": "radius-thumb",
    "layer": "semantic",
    "value": "2px",
    "alias": null,
    "description": "書封、favicon、圖例色塊：小圖只要一點點就夠，再多會看起來像貼紙"
  },
  {
    "name": "radius-control",
    "layer": "semantic",
    "value": "4px",
    "alias": null,
    "description": "按鈕、輸入框、分頁列、標籤——頁首那一排全部同一階"
  },
  {
    "name": "radius-surface",
    "layer": "semantic",
    "value": "8px",
    "alias": null,
    "description": "卡片、面板、浮層這類成塊的東西"
  }
];
