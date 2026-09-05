<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# 寫作風格

省形容詞與鋪陳，關鍵字組成短句。三處適用：

- **對話回應** — 條列優先，一項一行
- **註解** — 寫在程式碼後面同一行，不用 `/** */` 區塊；一行講不完就改名字讓結構自己說話
- **commit 主題** — `type: 名詞短語`。理由寫 body，body 也短

```
好：refactor: 共用 hook 移入 hooks/
壞：refactor: recordEdits 其實是 hook，改名 useRecordEdits 進 hooks/
```

# 程式風格

- **FP 為核心** — 純函式優先，不改參數、不藏副作用
- **I/O 集中在薄一層**（fetch、db、localStorage），轉換抽成純函式進 `utils/`，才測得到
- map／filter／reduce，不要邊迴圈邊改外部變數；資料不可變
- 不用 class 與繼承
- **一個檔一件事** — 超過 150 行就問「是不是混了兩件事」，尤其 I/O 混著資料整形

# 重構流程

一個主題一支分支，一個資料夾一個 commit。

1. 開分支
2. 每步先講「要改什麼、為什麼、風險」，確認後才動手
3. merge 回 main 前跑 `npm run check:all`（commit 不擋，pre-push 才擋）
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
  lib/          包過的第三方（swrCache、scrapers/…）
```

放哪：**兩個以上 feature 用 → 共用層；一個 feature 用 → 進該 feature**。`lib/` 只放第三方包裝。

eslint 用 `import/no-restricted-paths` 鎖邊界，跨 feature 例外列在 `ALLOWED`（5 條，領域交織處）。**新增例外前先想能不能不加。**

搬檔案的坑：`@/lib/x` 與同資料夾的 `./x` 都要改，只 sed 前者會漏。

# 指令

- `npm run check:all` — lint + format + types + test
- `npm run check:fast` — 前三項（約 16 秒，手動跑）
- husky：pre-push 跑 check:all、commit-msg 擋非 Conventional Commits；commit 不檢查
- eslint 有 `--cache`；改設定後第一次慢（`import/no-cycle` 約 83 秒）

# 產品原則

- 資料在 Postgres（drizzle，`lib/db`）。多值一行一筆，不塞 JSON
- 只收手動紀錄，不自動抓 commit 或運動 app
- 私人項目擋的是「同事瞄一眼」，不是加密；過濾在伺服器端
