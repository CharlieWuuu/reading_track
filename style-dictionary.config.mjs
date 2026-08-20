import StyleDictionary from "style-dictionary";

/**
 * Design token 建置。真實來源是 src/styles/tokens/*.json（DTCG 格式），
 * 產出物兩份、都進版控：
 *
 * - generated/tokens.css —— 包成 Tailwind v4 的 `@theme`，一次給出 CSS 變數與工具類
 * - generated/tokens.ts  —— 給 recharts，它吃字串值、拿不到 CSS 變數
 *
 * 三層分在三個檔：primitive 只有色票、semantic 給用途、component 只有單一元件在用。
 * 產出時三層會合進同一個 `@theme`，分層是給人看的，不是給瀏覽器看的。
 */

/** 中性灰沿用 Tailwind 內建的 gray，那些 token 的值就是 `var(--color-gray-N)`，不是色票 */
const isLiteralColor = (token) => /^#|^rgba?\(/.test(String(token.$value ?? token.value));

StyleDictionary.registerFormat({
  name: "typescript/flat-const",
  format: ({ dictionary }) => {
    const lines = dictionary.allTokens.map((token) => {
      const comment = token.$description ? ` // ${token.$description}` : "";
      return `  "${token.name.replace(/^color-/, "")}": "${token.$value ?? token.value}",${comment}`;
    });
    return [
      "// 由 style-dictionary 產生，不要手改。改 src/styles/tokens/*.json 後跑 npm run tokens",
      "",
      "export const TOKENS = {",
      ...lines,
      "} as const;",
      "",
      "export type TokenName = keyof typeof TOKENS;",
      "",
      "export function token(name: TokenName): string {",
      "  return TOKENS[name];",
      "}",
      "",
    ].join("\n");
  },
});

/** Storybook 展示頁用：三層都要列出來，包含只活在 CSS 裡、TS 拿不到值的那些 */
StyleDictionary.registerFormat({
  name: "typescript/manifest",
  format: ({ dictionary }) => {
    const rows = dictionary.allTokens.map((token) => {
      const original = String(token.original?.$value ?? "");
      return {
        name: token.name,
        layer: /(\w+)\.json$/.exec(token.filePath)?.[1] ?? "primitive",
        value: String(token.$value ?? token.value),
        // 參照就留原樣，展示頁才講得出「這個 token 指到哪一階」
        alias: original.startsWith("{") ? original.slice(1, -1).replace(/^color\./, "") : null,
        description: token.$description ?? null,
      };
    });
    return [
      "// 由 style-dictionary 產生，不要手改。改 src/styles/tokens/*.json 後跑 npm run tokens",
      "",
      'export type TokenLayer = "primitive" | "semantic" | "component";',
      "",
      "export interface TokenEntry {",
      "  name: string;",
      "  layer: TokenLayer;",
      "  value: string;",
      "  alias: string | null;",
      "  description: string | null;",
      "}",
      "",
      `export const TOKEN_MANIFEST: TokenEntry[] = ${JSON.stringify(rows, null, 2)};`,
      "",
    ].join("\n");
  },
});

const config = {
  usesDtcg: true,
  source: [
    "src/styles/tokens/primitive.json",
    "src/styles/tokens/semantic.json",
    "src/styles/tokens/component.json",
  ],
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "src/styles/generated/",
      files: [
        {
          destination: "tokens.css",
          format: "css/variables",
          // static：一律輸出全部變數。預設會 tree-shake 掉沒被掃到的，
          // 但 recharts 的 props 與 token 展示頁都是執行期組 var()，掃不到
          options: { selector: "@theme static", outputReferences: true },
        },
      ],
    },
    ts: {
      // 只轉名字：值已經是最終字串，套 color/hex 反而會動到 rgba()
      transforms: ["name/kebab"],
      buildPath: "src/styles/generated/",
      files: [
        {
          destination: "tokens.ts",
          format: "typescript/flat-const",
          filter: isLiteralColor,
          options: { showFileHeader: false },
        },
        {
          destination: "tokens.manifest.ts",
          format: "typescript/manifest",
          options: { showFileHeader: false },
        },
      ],
    },
  },
};

export default config;
