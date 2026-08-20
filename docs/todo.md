# 待辦

## 1. 整個類型設成私人

現在私人是一列一列標的（書寫表的「私人」欄填「是」）。想要的是「這個類型底下
的書寫全部都算私人」，不用每一則自己勾。之後可能推廣到書籍與文章。

**設定存哪**：Sheet「設定」分頁，key 用「私人類型」，一個類型一列
（`sheet-format.ts` 加常數）。不要在一格裡塞逗號分隔——多值一行一筆。
`lib/sheets.ts` 的 `readSetting` 只回第一列，要補一個回全部的版本。

**過濾**：`utils/privacy.ts` 的 `isPrivate` 現在只看 `row.private`，
要變成「private 欄有標 **或** kind 落在私人類型清單裡」。清單得從外面傳進來，
`withPrivacy` 的簽章會跟著變（呼叫點在 `api/_lib/collectionRoute.ts`
與 `api/records/route.ts`）。

**代價要先想清楚**：現在沒帶解鎖權杖時完全不讀設定分頁（`requestUnlocked`
一開頭就 return）。改完之後每次列表請求都得讀一次設定才知道哪些類型是私人的，
等於多一趟 Sheet 往返。可能的作法：

- 只有書寫的端點讀，書籍與文章先不做
- 或把設定分頁快取起來（它幾乎不會變）

**要決定的**：

- 類型設成私人後，那一則的「私人」欄要不要也跟著寫「是」？
  寫了的話 Sheet 上自己看得懂，但兩個真實來源會不同步；不寫的話 Sheet 上
  看不出這則是私人的——這個 app 的原則是 Sheet 要人可讀，傾向寫
- 推廣到書籍與文章時，對應的欄位是哪一個？書寫是 `kind`，書籍的類型是 `type`。
  設定 key 要不要拆成「私人類型」「私人書籍類型」，還是一個 key 帶欄位名

類型已經改名（書籍心得 → 書籍），Sheet 上這份私人類型清單要用新名字。

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
