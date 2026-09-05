# 部署（Vercel）

環境變數照 `.env.local.example`，但 `AUTH_SECRET` 要重新產一組別跟本機共用；`AUTH_URL` 不用設，程式開了 `trustHost`。

OAuth 回呼網址每多一個網域就要去 Cloud Console 加一條 `https://<網域>/api/auth/callback/google`。

## 區域

函式跑在東京（`vercel.json` 的 `regions`）。預設是美東，但資料庫在
`ap-northeast-1`，跨區光建立連線就量到 936ms——每一支 API 都要付這筆。
Hobby 方案只能指定一個區域，跟著資料庫走最划算。

## 已知限制

- 自動補齊資料在 Hobby 方案有 60 秒上限，所以會分批、每本補完就寫回資料庫。升 Pro 可把 `enrich/route.ts` 的 `maxDuration` 調到 300
- `/api/scrape` 走無頭瀏覽器（`@sparticuz/chromium`），冷啟動慢；純書名搜尋不經過它
- service worker 只在 production 註冊，且不快取任何 `/api/`
