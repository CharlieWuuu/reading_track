// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
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
  "entries",
  "keywords",
  "library",
  "notes",
  "settings",
  "stats",
];

const ALLOWED = {
  articles: ["entries"],
  books: ["entries", "keywords", "notes"],
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
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            ...featureZones,
            // 單向依賴：app 可以用 features，反過來不行
            { target: "./src/features", from: "./src/app" },
            // 共用的下層不能反過來依賴上層
            {
              target: ["./src/components", "./src/hooks", "./src/lib", "./src/types"],
              from: ["./src/features", "./src/app"],
            },
          ],
        },
      ],
    },
  },
  ...storybook.configs["flat/recommended"],
]);

export default eslintConfig;
