# 待辦

## 1. 紀事類型改名：書籍心得 → 書籍、文章心得 → 文章

從書籍／文章頁寫出來的紀事，`kind` 目前是「書籍心得」「文章心得」，要改成
「書籍」「文章」。

程式只有兩個字面值：

- `features/books/components/book-form.tsx` —— `kind="書籍心得"`
- `features/articles/components/article-form.tsx` —— `kind="文章心得"`
- `features/entries/components/related-entries.tsx` 的註解一起改

真正的工在 Sheet，程式改完不會自己生效：

- `kind` 是自由字串，選項清單來自 Sheet 的類型那組（`types/book.ts` 的
  `kind: { field: "kind", sources: ["entry"] }`），選項要先改名
- 既有紀事的類型欄還是舊字串，要批次取代。**先改 Sheet 再改程式**，
  反過來的話新寫的紀事會落在一個還不存在的選項上

要順便決定的：`api/entries/import-notes/route.ts` 寫的是第三個值 `kind: "心得"`
（把舊的心得欄搬成紀事時用的）。改名後這三個要不要收斂成同一組？
若「書籍」「文章」是指來源，那 import 出來的也該照來源標，不該叫「心得」。

風險：改名後舊網址的 `?kind=書籍心得` 會對不上（`entry-form.tsx` 從 query
讀預設值），但那只是表單預選，不會壞資料。

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

- design token 三層（style-dictionary）：來源是 `src/styles/tokens/*.json`，
  產出 `@theme`＋recharts 用的 TS＋Storybook 展示頁用的 manifest。
  `src` 裡除了 `:root` 底色與 PWA metadata，不再有硬寫的 hex
- Storybook 導入、`features/` 拆分、eslint 邊界規則
- prettier 補齊（`.prettierignore`、`check:all`）
- 共用層拆成 `hooks/`、`utils/`、`stores/`、`config/`；`lib/` 只剩第三方包裝
- `import/no-cycle`（零循環）、`check-file` kebab 檔名規則
- husky：pre-commit `check:fast`、pre-push `test`、commit-msg 擋格式
