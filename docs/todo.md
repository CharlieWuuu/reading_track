# 待辦

## 1. src/testing/（低優先）

bulletproof 有這層，但目前沒東西可放：真測試只有 2 個檔
（`app/api/_lib/*.test.ts`），78 個測試絕大多數是 storybook story。
沒有 test-utils、mock、fixture。

實際是「寫測試基礎建設」不是搬檔案：

- test-utils（render 包 provider）+ 假資料產生器：1–2 小時
- 再加 MSW mock API：2–3 小時

## 2. 零碎

- `features/` 的 `index.ts` barrel：bulletproof 建議，但有 tree-shaking 代價。
  這個規模先不做

# 已完成（2026-08-19 ~ 20）

- `auth.ts` 從根目錄移進 `lib/`
- 私人屬性套到書籍與文章：設定分頁多一個 key「私人屬性」，書籍私人時佳句與
  單字跟著藏
- 整個類型設成私人（書寫）：設定分頁「私人類型」一個類型一列，與個別列的
  「私人」欄是或的關係；類型設私人不回寫個別列
- 檔名全面 kebab（34 個），`check-file` 規則擴到全 `src/`，只排除 `app/`
- 紀事類型改名：書籍心得 → 書籍、文章心得 → 文章；import-notes 的「心得」也
  改成照來源標，三個值收斂成兩個
- design token 三層（style-dictionary）：來源是 `src/styles/tokens/*.json`，
  產出 `@theme`＋recharts 用的 TS＋Storybook 展示頁用的 manifest。
  `src` 裡除了 `:root` 底色與 PWA metadata，不再有硬寫的 hex
- Storybook 導入、`features/` 拆分、eslint 邊界規則
- prettier 補齊（`.prettierignore`、`check:all`）
- 共用層拆成 `hooks/`、`utils/`、`stores/`、`config/`；`lib/` 只剩第三方包裝
- `import/no-cycle`（零循環）、`check-file` kebab 檔名規則
- husky：pre-commit `check:fast`、pre-push `test`、commit-msg 擋格式
