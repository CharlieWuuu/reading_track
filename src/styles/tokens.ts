/**
 * primitive 色階的 TS 鏡射。
 *
 * 真實來源是 `src/app/globals.css` 的 `@theme`；這裡存在只因為 recharts 吃的是
 * 字串值，拿不到 CSS 變數。兩邊由 tokens.test.ts 逐鍵比對，漂了會紅。
 * 新增色階時兩邊都要加。
 *
 * semantic 與 component 兩層不鏡射：那兩層只有 class 與 CSS 變數會用到。
 */
export const PRIMITIVES = {
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
  "mint-350": "#b5d4c8",
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
  "sand-250": "#e8e0d0",
  "sand-300": "#d5cabb",
  "sand-500": "#a2957f",
  "sand-600": "#8b7767",
  "sand-700": "#6f5b4c",
  "sand-800": "#5c4a3d",
} as const;

export type PrimitiveName = keyof typeof PRIMITIVES;

export function primitive(name: PrimitiveName): string {
  return PRIMITIVES[name];
}
