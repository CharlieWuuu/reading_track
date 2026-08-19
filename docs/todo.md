# 待辦

## 1. Design token system（下一個要做的）

目前色彩散在三處，各自為政：

- `src/utils/chartPalette.ts` — `CATEGORICAL`、`SEQUENTIAL`、`VIZ_TOKENS`（給 recharts）
- `src/utils/tagColors.ts` — `TAG_COLORS`、`TAG_OUTLINE_COLORS`、`TAG_TONES`
- 元件裡的 Tailwind class — `src/components/ui/controls/styles.ts` 有 `CONTROL_HEIGHT`，其餘直接寫在 className

要決定的事：

- token 的真實來源放哪：CSS 變數（Tailwind v4 的 `@theme`）還是 TS 常數？
  圖表需要 TS 值（recharts 吃不到 CSS 變數），元件需要 class → 可能要雙向
- 分層：primitive（色階）→ semantic（`--color-danger`）→ component
- 深色模式現在怎麼做的？要先盤點
- Storybook 可以做 token 展示頁，順便當視覺回歸

放 `src/config/` 或新開 `src/styles/`，開工前再決定。

## 2. 命名統一（30 分鐘）

`hooks/`、`utils/` 是 camelCase，`components/`、`features/` 是 kebab，兩套並存。

統一成 kebab 要改約 30 個檔名，改完把 `check-file` 規則的範圍從
`components/**` + `features/**` 擴到全 `src/`（`app/` 要排除，有 `[id]` 動態路由）。

## 3. src/testing/（低優先）

bulletproof 有這層，但目前沒東西可放：真測試只有 2 個檔
（`app/api/_lib/*.test.ts`），78 個測試絕大多數是 storybook story。
沒有 test-utils、mock、fixture。

實際是「寫測試基礎建設」不是搬檔案：

- test-utils（render 包 provider）+ 假資料產生器：1–2 小時
- 再加 MSW mock API：2–3 小時

## 4. 零碎

- `src/auth.ts` 散在根目錄，可進 `lib/` 或 `config/`
- `features/` 的 `index.ts` barrel：bulletproof 建議，但有 tree-shaking 代價。
  這個規模先不做

# 已完成（2026-08-19 ~ 20）

- Storybook 導入、`features/` 拆分、eslint 邊界規則
- prettier 補齊（`.prettierignore`、`check:all`）
- 共用層拆成 `hooks/`、`utils/`、`stores/`、`config/`；`lib/` 只剩第三方包裝
- `import/no-cycle`（零循環）、`check-file` kebab 檔名規則
- husky：pre-commit `check:fast`、pre-push `test`、commit-msg 擋格式
