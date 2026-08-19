# API route 重構：前後對照

`refactor/api-routes` branch。改完把「之後」那幾欄補上，合併前決定這份要不要留。

## 目標

`src/app/api/{books,articles,entries}/route.ts`（GET、POST）與
`src/app/api/{books,articles,entries}/[id]/route.ts`（PATCH、DELETE）六支，
除了表名與呼叫哪一組 sheets 函式之外逐字相同。

## 基準線（2026-08-19，重構前）

| 指標 | 之前 | 之後 |
| --- | --- | --- |
| 檔案數 | 6 | |
| 總行數 | 273 | |
| 非空行 | 231 | |
| 回錯誤的行 | 36 | |
| try / catch / console.error | 27 | |
| `requireSession()` 各寫一份 | 6 | |
| 新增的共用檔行數 | 0 | |
| **淨行數**（六支＋共用檔） | **273** | |

## 重構前已經存在的不一致

改完之後這幾項應該都只有一個答案：

- 訊息：讀取叫「讀取 Sheet 失敗」、更新叫「更新 Sheet 失敗」，刪除卻叫「刪除失敗」
- log：三支 `route.ts` 有 `console.error`，三支 `[id]/route.ts` 完全沒有——
  更新或刪除失敗時伺服器上查不到任何紀錄
- 接錯誤的方式：9 處 `catch {}`（連錯誤物件都不接）、3 處 `catch (err)`

## 驗收

- [ ] `npx tsc --noEmit`、`npx eslint src`、`npx next build` 全過
- [ ] 呼叫端（`src/lib`、`src/components`）一行都沒改
- [ ] 四種操作各實際跑一次：新增、編輯、刪除、鎖上時讀取
- [ ] 所有 502 都會留下 log

## 怎麼量

```sh
find src/app/api -name route.ts | grep -E '(books|articles|entries)/(\[id\]/)?route.ts$' > /tmp/six.txt
xargs cat < /tmp/six.txt | wc -l                                  # 總行數
xargs cat < /tmp/six.txt | grep -c '[^ ]'                         # 非空行
xargs grep -h 'NextResponse.json({ error' < /tmp/six.txt | wc -l  # 回錯誤的行
```
