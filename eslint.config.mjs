// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import checkFile from "eslint-plugin-check-file";
import storybook from "eslint-plugin-storybook";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * feature 之間預設不能互相 import；下面列出的才是刻意的例外。
 *
 * 這些例外都是領域本身就交織的地方——書要顯示它的關鍵字、佳句、相關紀事。
 * 要拆開得從頁面層傳 render props，對這個專案不划算。新的跨界會被擋下來。
 */
const FEATURES = [
  "articles",
  "auth",
  "books",
  "calendar",
  "journal",
  "keywords",
  "reading",
  "notes",
  "settings",
  "stats",
];

const ALLOWED = {
  articles: ["journal"],
  books: ["journal", "keywords", "notes"],
  notes: ["keywords"],
};

const featureZones = FEATURES.map((feature) => ({
  target: `./src/features/${feature}`,
  from: "./src/features",
  except: [`./${feature}`, ...(ALLOWED[feature] ?? []).map((f) => `./${f}`)],
}));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Storybook 的靜態產出，不是原始碼
    "storybook-static/**",
  ]),
  {
    rules: {
      "import/no-cycle": "error",
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            ...featureZones,
            // 單向依賴：app 可以用 features，反過來不行
            { target: "./src/features", from: "./src/app" },
            // 共用的下層不能反過來依賴上層
            {
              target: [
                "./src/components",
                "./src/config",
                "./src/hooks",
                "./src/lib",
                "./src/stores",
                "./src/types",
                "./src/utils",
              ],
              from: ["./src/features", "./src/app"],
            },
          ],
        },
      ],
    },
  },
  {
    // 假資料只給測試用，不能被正式程式碼 import——不然它會跟著進 bundle
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}", "src/**/*.stories.tsx", "src/testing/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["@/testing/*", "**/testing/*"] }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/app/**"], // 動態路由 [id] 與 _lib 底線資料夾過不了 kebab 檢查
    plugins: { "check-file": checkFile },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        { "**/*.{ts,tsx}": "KEBAB_CASE" },
        { ignoreMiddleExtensions: true },
      ],
      "check-file/folder-naming-convention": ["error", { "**/*": "KEBAB_CASE" }],
    },
  },
  ...storybook.configs["flat/recommended"],
]);

export default eslintConfig;
