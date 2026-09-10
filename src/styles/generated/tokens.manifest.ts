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
    "name": "color-neutral-100",
    "layer": "primitive",
    "value": "#f5f5f6",
    "alias": null,
    "description": null
  },
  {
    "name": "color-neutral-200",
    "layer": "primitive",
    "value": "#ededef",
    "alias": null,
    "description": "細分隔線；報頭的實線用 900，兩者不同用途"
  },
  {
    "name": "color-neutral-300",
    "layer": "primitive",
    "value": "#d4d5d8",
    "alias": null,
    "description": null
  },
  {
    "name": "color-neutral-400",
    "layer": "primitive",
    "value": "#a2a4a9",
    "alias": null,
    "description": null
  },
  {
    "name": "color-neutral-500",
    "layer": "primitive",
    "value": "#6a6c70",
    "alias": null,
    "description": null
  },
  {
    "name": "color-neutral-600",
    "layer": "primitive",
    "value": "#4a4c50",
    "alias": null,
    "description": null
  },
  {
    "name": "color-neutral-700",
    "layer": "primitive",
    "value": "#2e3033",
    "alias": null,
    "description": null
  },
  {
    "name": "color-neutral-900",
    "layer": "primitive",
    "value": "#17181a",
    "alias": null,
    "description": "正文與報頭線。版型稿的中性色，比純黑淺一階"
  },
  {
    "name": "color-cactus-100",
    "layer": "primitive",
    "value": "#dde4da",
    "alias": null,
    "description": null
  },
  {
    "name": "color-cactus-300",
    "layer": "primitive",
    "value": "#a9baa4",
    "alias": null,
    "description": null
  },
  {
    "name": "color-cactus-500",
    "layer": "primitive",
    "value": "#6f8a68",
    "alias": null,
    "description": null
  },
  {
    "name": "color-cactus-700",
    "layer": "primitive",
    "value": "#4f6b4a",
    "alias": null,
    "description": "主重點色，取自靜野封面的仙人掌；白底對比 5.9:1"
  },
  {
    "name": "color-cactus-900",
    "layer": "primitive",
    "value": "#3b5237",
    "alias": null,
    "description": null
  },
  {
    "name": "color-dune-100",
    "layer": "primitive",
    "value": "#f4ece1",
    "alias": null,
    "description": null
  },
  {
    "name": "color-dune-300",
    "layer": "primitive",
    "value": "#e4d3bc",
    "alias": null,
    "description": null
  },
  {
    "name": "color-dune-500",
    "layer": "primitive",
    "value": "#c08a4e",
    "alias": null,
    "description": "白底只有 3.0:1，只做圖表與色塊，不拿來寫字"
  },
  {
    "name": "color-dune-700",
    "layer": "primitive",
    "value": "#8f6534",
    "alias": null,
    "description": null
  },
  {
    "name": "color-sky-100",
    "layer": "primitive",
    "value": "#e6ecef",
    "alias": null,
    "description": null
  },
  {
    "name": "color-sky-300",
    "layer": "primitive",
    "value": "#c3ced5",
    "alias": null,
    "description": null
  },
  {
    "name": "color-sky-500",
    "layer": "primitive",
    "value": "#8fa3ae",
    "alias": null,
    "description": null
  },
  {
    "name": "color-sky-700",
    "layer": "primitive",
    "value": "#5f7787",
    "alias": null,
    "description": null
  },
  {
    "name": "color-brick-100",
    "layer": "primitive",
    "value": "#f7e4e1",
    "alias": null,
    "description": null
  },
  {
    "name": "color-brick-300",
    "layer": "primitive",
    "value": "#e8b6b0",
    "alias": null,
    "description": null
  },
  {
    "name": "color-brick-500",
    "layer": "primitive",
    "value": "#c0392b",
    "alias": null,
    "description": "錯誤與未完成，沿用原本的磚紅"
  },
  {
    "name": "color-brick-700",
    "layer": "primitive",
    "value": "#a13023",
    "alias": null,
    "description": null
  },
  {
    "name": "color-ash-100",
    "layer": "primitive",
    "value": "#e6e5e2",
    "alias": null,
    "description": null
  },
  {
    "name": "color-ash-300",
    "layer": "primitive",
    "value": "#c2c0ba",
    "alias": null,
    "description": null
  },
  {
    "name": "color-ash-500",
    "layer": "primitive",
    "value": "#6b6a64",
    "alias": null,
    "description": "淡墨，取自靜野封面配色；白底對比 5.4:1"
  },
  {
    "name": "color-ash-700",
    "layer": "primitive",
    "value": "#4c4b46",
    "alias": null,
    "description": null
  },
  {
    "name": "color-plum-100",
    "layer": "primitive",
    "value": "#ece2e6",
    "alias": null,
    "description": null
  },
  {
    "name": "color-plum-300",
    "layer": "primitive",
    "value": "#c9aebb",
    "alias": null,
    "description": null
  },
  {
    "name": "color-plum-500",
    "layer": "primitive",
    "value": "#9c6b80",
    "alias": null,
    "description": null
  },
  {
    "name": "color-plum-700",
    "layer": "primitive",
    "value": "#764f61",
    "alias": null,
    "description": "延伸自靜野色系的梅紫，白底對比 6.9:1"
  },
  {
    "name": "color-straw-100",
    "layer": "primitive",
    "value": "#f6efd9",
    "alias": null,
    "description": null
  },
  {
    "name": "color-straw-300",
    "layer": "primitive",
    "value": "#e6d59f",
    "alias": null,
    "description": null
  },
  {
    "name": "color-straw-500",
    "layer": "primitive",
    "value": "#c7a94a",
    "alias": null,
    "description": "白底只有 2.3:1，只做圖表與色塊，不拿來寫字"
  },
  {
    "name": "color-straw-700",
    "layer": "primitive",
    "value": "#836826",
    "alias": null,
    "description": "延伸自靜野色系的若線黃，白底對比 5.3:1"
  },
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
    "value": "#f5f5f6",
    "alias": "neutral.100",
    "description": null
  },
  {
    "name": "color-surface-viz",
    "layer": "semantic",
    "value": "#f5f5f6",
    "alias": "neutral.100",
    "description": "圖表畫布，比頁面底色深一階才分得出圖與頁"
  },
  {
    "name": "color-surface-selected",
    "layer": "semantic",
    "value": "#e4d3bc",
    "alias": "dune.300",
    "description": "選取與大面積色塊；配色稿裡唯一拿來鋪底的暖色"
  },
  {
    "name": "color-ink",
    "layer": "semantic",
    "value": "#17181a",
    "alias": "neutral.900",
    "description": null
  },
  {
    "name": "color-ink-secondary",
    "layer": "semantic",
    "value": "#2e3033",
    "alias": "neutral.700",
    "description": "摘要與內文；比正文淡一階，還是拿來讀的"
  },
  {
    "name": "color-ink-muted",
    "layer": "semantic",
    "value": "#6a6c70",
    "alias": "neutral.500",
    "description": null
  },
  {
    "name": "color-ink-faint",
    "layer": "semantic",
    "value": "#a2a4a9",
    "alias": "neutral.400",
    "description": "meta 與全大寫小標籤"
  },
  {
    "name": "color-ink-viz",
    "layer": "semantic",
    "value": "#17181a",
    "alias": "neutral.900",
    "description": "圖上的文字"
  },
  {
    "name": "color-ink-viz-muted",
    "layer": "semantic",
    "value": "#6a6c70",
    "alias": "neutral.500",
    "description": null
  },
  {
    "name": "color-ink-viz-faint",
    "layer": "semantic",
    "value": "#a2a4a9",
    "alias": "neutral.400",
    "description": null
  },
  {
    "name": "color-accent",
    "layer": "semantic",
    "value": "#4f6b4a",
    "alias": "cactus.700",
    "description": "主色：主要動作鍵、選中的分頁、在讀那顆點。白底 5.9:1"
  },
  {
    "name": "color-accent-hover",
    "layer": "semantic",
    "value": "#3b5237",
    "alias": "cactus.900",
    "description": null
  },
  {
    "name": "color-accent-ink",
    "layer": "semantic",
    "value": "#ffffff",
    "alias": "white",
    "description": "壓在主色上的字"
  },
  {
    "name": "color-rule",
    "layer": "semantic",
    "value": "#ededef",
    "alias": "neutral.200",
    "description": "細線分隔，取代卡片框。1px"
  },
  {
    "name": "color-rule-soft",
    "layer": "semantic",
    "value": "#f5f5f6",
    "alias": "neutral.100",
    "description": "同一塊裡分列用；rule 是「這是兩個東西」，這一階是「同一件事的下一行」"
  },
  {
    "name": "color-rule-strong",
    "layer": "semantic",
    "value": "#17181a",
    "alias": "neutral.900",
    "description": "區段小標下面那條實線與報頭雙線。1.4px／3px"
  },
  {
    "name": "color-shell-rule",
    "layer": "semantic",
    "value": "#17181a",
    "alias": "neutral.900",
    "description": "外殼邊界（側欄右緣、報頭）。跟區段實線同色，畫的是版面骨架"
  },
  {
    "name": "color-grid",
    "layer": "semantic",
    "value": "#ededef",
    "alias": "neutral.200",
    "description": "圖表格線；跟細分隔線同一階"
  },
  {
    "name": "color-series-1",
    "layer": "semantic",
    "value": "#4f6b4a",
    "alias": "cactus.700",
    "description": null
  },
  {
    "name": "color-series-2",
    "layer": "semantic",
    "value": "#c08a4e",
    "alias": "dune.500",
    "description": null
  },
  {
    "name": "color-series-3",
    "layer": "semantic",
    "value": "#8fa3ae",
    "alias": "sky.500",
    "description": null
  },
  {
    "name": "color-series-track",
    "layer": "semantic",
    "value": "#f5f5f6",
    "alias": "neutral.100",
    "description": "長條圖後面那條空軌"
  },
  {
    "name": "color-series-overflow",
    "layer": "semantic",
    "value": "#b9b6ae",
    "alias": null,
    "description": "第 9 個以後合併成「其他」的那一格，不是第 9 個色；recharts 要字面值"
  },
  {
    "name": "color-status-want-dot",
    "layer": "semantic",
    "value": "#d4d5d8",
    "alias": "neutral.300",
    "description": "狀態只靠一顆點的深淺：想讀最淡"
  },
  {
    "name": "color-status-reading-dot",
    "layer": "semantic",
    "value": "#4f6b4a",
    "alias": "accent",
    "description": "在讀是唯一有彩度的一顆"
  },
  {
    "name": "color-status-done-dot",
    "layer": "semantic",
    "value": "#a9baa4",
    "alias": "cactus.300",
    "description": null
  },
  {
    "name": "color-tag-domain-bg",
    "layer": "semantic",
    "value": "#e4d3bc",
    "alias": "dune.300",
    "description": "主領域：唯一鋪底的標籤"
  },
  {
    "name": "color-tag-domain-ink",
    "layer": "semantic",
    "value": "#17181a",
    "alias": "neutral.900",
    "description": null
  },
  {
    "name": "color-tag-domain-ring",
    "layer": "semantic",
    "value": "#c08a4e",
    "alias": "dune.500",
    "description": "次領域改成底線版；同色系＝同一件事的粗細兩層"
  },
  {
    "name": "color-tag-platform-bg",
    "layer": "semantic",
    "value": "#f5f5f6",
    "alias": "neutral.100",
    "description": null
  },
  {
    "name": "color-tag-platform-ink",
    "layer": "semantic",
    "value": "#4a4c50",
    "alias": "neutral.600",
    "description": null
  },
  {
    "name": "color-tag-type-ink",
    "layer": "semantic",
    "value": "#4a4c50",
    "alias": "neutral.600",
    "description": null
  },
  {
    "name": "color-tag-type-ring",
    "layer": "semantic",
    "value": "#d4d5d8",
    "alias": "neutral.300",
    "description": null
  },
  {
    "name": "color-tag-language-bg",
    "layer": "semantic",
    "value": "#f5f5f6",
    "alias": "neutral.100",
    "description": null
  },
  {
    "name": "color-tag-language-ink",
    "layer": "semantic",
    "value": "#4a4c50",
    "alias": "neutral.600",
    "description": null
  },
  {
    "name": "color-tag-article-bg",
    "layer": "semantic",
    "value": "#f5f5f6",
    "alias": "neutral.100",
    "description": null
  },
  {
    "name": "color-tag-article-ink",
    "layer": "semantic",
    "value": "#6a6c70",
    "alias": "neutral.500",
    "description": "文章標籤是自由打的，沒有固定選項可配色，整組同一個中性色"
  },
  {
    "name": "color-danger",
    "layer": "semantic",
    "value": "#c0392b",
    "alias": "brick.500",
    "description": "錯誤與未完成"
  },
  {
    "name": "color-control-bg",
    "layer": "component",
    "value": "#4f6b4a",
    "alias": "accent",
    "description": "主要動作鍵與選中的分頁；改這裡全站一起變"
  },
  {
    "name": "color-control-bg-hover",
    "layer": "component",
    "value": "#3b5237",
    "alias": "accent-hover",
    "description": null
  },
  {
    "name": "color-control-ink",
    "layer": "component",
    "value": "#ffffff",
    "alias": "accent-ink",
    "description": null
  },
  {
    "name": "color-control-ink-idle",
    "layer": "component",
    "value": "#6a6c70",
    "alias": "ink-muted",
    "description": "分頁列沒選中的那幾格"
  },
  {
    "name": "color-control-ink-secondary",
    "layer": "component",
    "value": "#4a4c50",
    "alias": "neutral.600",
    "description": "次要按鈕的字：比 ink-idle 深一階，它是可按的、不是沒選中的"
  },
  {
    "name": "color-control-ink-faint",
    "layer": "component",
    "value": "#a2a4a9",
    "alias": "ink-faint",
    "description": null
  },
  {
    "name": "color-control-ink-faint-hover",
    "layer": "component",
    "value": "#2e3033",
    "alias": "neutral.700",
    "description": null
  },
  {
    "name": "color-control-border",
    "layer": "component",
    "value": "#ededef",
    "alias": "rule",
    "description": null
  },
  {
    "name": "color-control-ghost-hover",
    "layer": "component",
    "value": "#f5f5f6",
    "alias": "neutral.100",
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
    "value": "#f5f5f6",
    "alias": "surface-sunken",
    "description": null
  },
  {
    "name": "color-table-header-bg",
    "layer": "component",
    "value": "#f5f5f6",
    "alias": "neutral.100",
    "description": null
  },
  {
    "name": "color-table-header-rule",
    "layer": "component",
    "value": "#ededef",
    "alias": "rule",
    "description": "表頭下緣用 inset shadow 畫，sticky 時 border 會被捲掉。用一般的框線色，深棕壓在淺色表頭下面太重"
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
    "value": "#2e3033",
    "alias": "neutral.700",
    "description": null
  },
  {
    "name": "color-map-chrome-border",
    "layer": "component",
    "value": "#ededef",
    "alias": "rule",
    "description": null
  },
  {
    "name": "color-map-chrome-disabled",
    "layer": "component",
    "value": "#f5f5f6",
    "alias": "neutral.100",
    "description": null
  },
  {
    "name": "color-map-attribution-ink",
    "layer": "component",
    "value": "#a2a4a9",
    "alias": "neutral.400",
    "description": null
  },
  {
    "name": "color-map-attribution-link",
    "layer": "component",
    "value": "#6a6c70",
    "alias": "neutral.500",
    "description": null
  },
  {
    "name": "font-serif",
    "layer": "semantic",
    "value": "var(--font-noto-serif), Georgia, 'Songti TC', serif",
    "alias": null,
    "description": "值用襯線：書名、單字、數字、站名"
  },
  {
    "name": "font-sans",
    "layer": "semantic",
    "value": "var(--font-noto-sans), 'PingFang TC', sans-serif",
    "alias": null,
    "description": "標籤與介面文字"
  },
  {
    "name": "text-site",
    "layer": "semantic",
    "value": "40px",
    "alias": null,
    "description": "報頭站名"
  },
  {
    "name": "text-lede",
    "layer": "semantic",
    "value": "34px",
    "alias": null,
    "description": "頭條：一頁只有一個"
  },
  {
    "name": "text-page",
    "layer": "semantic",
    "value": "30px",
    "alias": null,
    "description": "頁名"
  },
  {
    "name": "text-item",
    "layer": "semantic",
    "value": "17px",
    "alias": null,
    "description": "主要條目"
  },
  {
    "name": "text-item-sm",
    "layer": "semantic",
    "value": "15px",
    "alias": null,
    "description": "次要條目、側欄條目"
  },
  {
    "name": "text-note",
    "layer": "semantic",
    "value": "14px",
    "alias": null,
    "description": "襯線摘要與引文"
  },
  {
    "name": "text-ui",
    "layer": "semantic",
    "value": "13.5px",
    "alias": null,
    "description": "導覽項目、按鈕"
  },
  {
    "name": "text-byline",
    "layer": "semantic",
    "value": "12px",
    "alias": null,
    "description": "作者行"
  },
  {
    "name": "text-meta",
    "layer": "semantic",
    "value": "11px",
    "alias": null,
    "description": "日期、計數"
  },
  {
    "name": "text-label",
    "layer": "semantic",
    "value": "10.5px",
    "alias": null,
    "description": "全大寫小標籤"
  },
  {
    "name": "tracking-label",
    "layer": "semantic",
    "value": "0.16em",
    "alias": null,
    "description": "全大寫小標籤"
  },
  {
    "name": "tracking-section",
    "layer": "semantic",
    "value": "0.12em",
    "alias": null,
    "description": "側欄分類標題"
  },
  {
    "name": "tracking-tight",
    "layer": "semantic",
    "value": "-0.02em",
    "alias": null,
    "description": "站名與頭條"
  },
  {
    "name": "stroke-hairline",
    "layer": "semantic",
    "value": "1px",
    "alias": null,
    "description": "細線分隔"
  },
  {
    "name": "stroke-solid",
    "layer": "semantic",
    "value": "1.4px",
    "alias": null,
    "description": "小標籤下面那條實線、報頭第二條"
  },
  {
    "name": "stroke-masthead",
    "layer": "semantic",
    "value": "3px",
    "alias": null,
    "description": "報頭第一條"
  },
  {
    "name": "radius-thumb",
    "layer": "semantic",
    "value": "1px",
    "alias": null,
    "description": "書封、favicon、圖例色塊：報紙感要幾乎是直角"
  },
  {
    "name": "radius-control",
    "layer": "semantic",
    "value": "0px",
    "alias": null,
    "description": "按鈕、輸入框、分頁列、標籤——版面靠線分，圓角會讓它們看起來像貼紙"
  },
  {
    "name": "radius-surface",
    "layer": "semantic",
    "value": "0px",
    "alias": null,
    "description": "面板與浮層；細線分隔不用卡片框，所以也不需要圓角"
  }
];
