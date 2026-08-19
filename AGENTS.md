<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# 寫作風格

省形容詞與鋪陳，關鍵字組成短句。適用三處：

- **對話回應** — 條列優先，一項一行
- **註解** — 盡量寫在程式碼後面同一行，不要多行 `/** */` 區塊；一行講不完就改名字讓結構自己說話
- **commit 主題** — `type: 名詞短語`。理由寫 body，body 也要短

```
好：refactor: 共用 hook 移入 hooks/
壞：refactor: recordEdits 其實是 hook，改名 useRecordEdits 進 hooks/
```

# 重構流程

一個主題一支分支，一個資料夾一個 commit。

1. 開分支
2. 每步先講「要改什麼、為什麼、風險」，確認後才動手
3. 每個 commit 前跑 `npm run check:all`，綠了才 commit
4. 收尾寫 `docs/devlog.md`（gitignore，只留本機；新的寫最上面）
5. `git merge --no-ff` 回 main → push

# 專案架構

bulletproof-react。單向依賴：`shared → features → app`。

```
src/
  app/          Next.js App Router
  components/   ui/（純元件，有 story）、layout/（外殼）
  features/     10 個業務領域，各含 components/
  hooks/        跨 feature 的資料 hook（useBooks 等）
  utils/        純函式
  stores/       zustand
  config/       協定常數
  types/        全域型別
  lib/          包過的第三方（sheets、swrCache、scrapers/…）
```

判斷放哪：**被兩個以上 feature 用 → 共用層；只有一個 feature 用 → 進該 feature**。
`lib/` 只放第三方包裝，不是雜物間。

eslint 用 `import/no-restricted-paths` 鎖邊界，跨 feature 例外列在 `ALLOWED`（目前 5 條，都是領域本身交織處）。**新增例外前先想能不能不加。**

搬檔案的坑：改 import 時 `@/lib/x` 與同資料夾的 `./x` 都要處理，只 sed 前者會漏。

# 指令

- `npm run check:all` — lint + format + types + test
- `npm run check:fast` — 前三項（pre-commit 跑這個，約 16 秒）
- husky：pre-commit 跑 check:fast、pre-push 跑 test、commit-msg 擋非 Conventional Commits
- eslint 有 `--cache`；改設定後第一次會慢（`import/no-cycle` 約 83 秒）

# 產品原則

- Google Sheet 同時是資料庫與後台編輯器，**不要提遷移**。多值一行一筆，不塞 JSON
- 只收手動紀錄，不自動抓 commit 或運動 app
- 私人項目擋的是「同事瞄一眼」，不是加密；過濾做在伺服器端
