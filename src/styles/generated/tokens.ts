// 由 style-dictionary 產生，不要手改。改 src/styles/tokens/*.json 後跑 npm run tokens

export const TOKENS = {
  "neutral-100": "#f5f5f6",
  "neutral-200": "#ededef", // 細分隔線；報頭的實線用 900，兩者不同用途
  "neutral-300": "#d4d5d8",
  "neutral-400": "#a2a4a9",
  "neutral-500": "#6a6c70",
  "neutral-600": "#4a4c50",
  "neutral-700": "#2e3033",
  "neutral-900": "#17181a", // 正文與報頭線。版型稿的中性色，比純黑淺一階
  "cactus-100": "#dde4da",
  "cactus-300": "#a9baa4",
  "cactus-500": "#6f8a68",
  "cactus-700": "#4f6b4a", // 主重點色，取自靜野封面的仙人掌；白底對比 5.9:1
  "cactus-900": "#3b5237",
  "dune-100": "#f4ece1",
  "dune-300": "#e4d3bc",
  "dune-500": "#c08a4e", // 白底只有 3.0:1，只做圖表與色塊，不拿來寫字
  "dune-700": "#8f6534",
  "sky-100": "#e6ecef",
  "sky-300": "#c3ced5",
  "sky-500": "#8fa3ae",
  "sky-700": "#5f7787",
  "brick-100": "#f7e4e1",
  "brick-300": "#e8b6b0",
  "brick-500": "#c0392b", // 錯誤與未完成，沿用原本的磚紅
  "brick-700": "#a13023",
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
  "surface-sunken": "#f5f5f6",
  "surface-viz": "#f5f5f6", // 圖表畫布，比頁面底色深一階才分得出圖與頁
  "surface-selected": "#e4d3bc", // 選取與大面積色塊；配色稿裡唯一拿來鋪底的暖色
  "ink": "#17181a",
  "ink-secondary": "#2e3033", // 摘要與內文；比正文淡一階，還是拿來讀的
  "ink-muted": "#6a6c70",
  "ink-faint": "#a2a4a9", // meta 與全大寫小標籤
  "ink-viz": "#17181a", // 圖上的文字
  "ink-viz-muted": "#6a6c70",
  "ink-viz-faint": "#a2a4a9",
  "accent": "#4f6b4a", // 主色：主要動作鍵、選中的分頁、在讀那顆點。白底 5.9:1
  "accent-hover": "#3b5237",
  "accent-ink": "#ffffff", // 壓在主色上的字
  "rule": "#ededef", // 細線分隔，取代卡片框。1px
  "rule-soft": "#f5f5f6", // 同一塊裡分列用；rule 是「這是兩個東西」，這一階是「同一件事的下一行」
  "rule-strong": "#17181a", // 區段小標下面那條實線與報頭雙線。1.4px／3px
  "shell-rule": "#17181a", // 外殼邊界（側欄右緣、報頭）。跟區段實線同色，畫的是版面骨架
  "grid": "#ededef", // 圖表格線；跟細分隔線同一階
  "series-1": "#4f6b4a",
  "series-2": "#c08a4e",
  "series-3": "#8fa3ae",
  "series-track": "#f5f5f6", // 長條圖後面那條空軌
  "series-overflow": "#b9b6ae", // 第 9 個以後合併成「其他」的那一格，不是第 9 個色；recharts 要字面值
  "status-want-dot": "#d4d5d8", // 狀態只靠一顆點的深淺：想讀最淡
  "status-want-bg": "#ffffff",
  "status-want-ink": "#6a6c70",
  "status-reading-dot": "#4f6b4a", // 在讀是唯一有彩度的一顆
  "status-reading-bg": "#ffffff",
  "status-reading-ink": "#17181a",
  "status-done-dot": "#a9baa4",
  "status-done-bg": "#ffffff",
  "status-done-ink": "#6a6c70",
  "tag-domain-bg": "#e4d3bc", // 主領域：唯一鋪底的標籤
  "tag-domain-ink": "#17181a",
  "tag-domain-ring": "#c08a4e", // 次領域改成底線版；同色系＝同一件事的粗細兩層
  "tag-platform-bg": "#f5f5f6",
  "tag-platform-ink": "#4a4c50",
  "tag-type-ink": "#4a4c50",
  "tag-type-ring": "#d4d5d8",
  "tag-language-bg": "#f5f5f6",
  "tag-language-ink": "#4a4c50",
  "tag-article-bg": "#f5f5f6",
  "tag-article-ink": "#6a6c70", // 文章標籤是自由打的，沒有固定選項可配色，整組同一個中性色
  "danger": "#c0392b", // 錯誤與未完成
  "control-bg": "#4f6b4a", // 主要動作鍵與選中的分頁；改這裡全站一起變
  "control-bg-hover": "#3b5237",
  "control-ink": "#ffffff",
  "control-ink-idle": "#6a6c70", // 分頁列沒選中的那幾格
  "control-ink-secondary": "#4a4c50", // 次要按鈕的字：比 ink-idle 深一階，它是可按的、不是沒選中的
  "control-ink-faint": "#a2a4a9",
  "control-ink-faint-hover": "#2e3033",
  "control-border": "#ededef",
  "control-ghost-hover": "#f5f5f6",
  "control-menu-bg": "#ffffff",
  "control-menu-hover": "#f5f5f6",
  "table-header-bg": "#f5f5f6",
  "table-header-rule": "#ededef", // 表頭下緣用 inset shadow 畫，sticky 時 border 會被捲掉。用一般的框線色，深棕壓在淺色表頭下面太重
  "map-label-bg": "rgba(255, 255, 255, 0.9)", // 地名常駐在密集的點上，要半透明白底才讀得到
  "map-label-ink": "#2e3033",
  "map-chrome-border": "#ededef",
  "map-chrome-disabled": "#f5f5f6",
  "map-attribution-ink": "#a2a4a9",
  "map-attribution-link": "#6a6c70",
} as const;

export type TokenName = keyof typeof TOKENS;

export function token(name: TokenName): string {
  return TOKENS[name];
}
