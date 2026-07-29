# 部署到 Vercel

程式端已經設定好了，以下是你要在 Vercel 和 Google Cloud Console 手動做的事。

## 1. 匯入專案

把 repo 推到 GitHub，在 Vercel 選 **Add New → Project → Import**。Framework 會自動偵測成 Next.js，Build 指令不用改。

## 2. 環境變數

在 Vercel 專案的 **Settings → Environment Variables** 加上這些（Production 和 Preview 都要）：

| 變數 | 值 |
| --- | --- |
| `GOOGLE_CLIENT_ID` | 跟本機 `.env.local` 一樣 |
| `GOOGLE_CLIENT_SECRET` | 跟本機一樣 |
| `NEXT_PUBLIC_GOOGLE_API_KEY` | 跟本機一樣 |
| `AUTH_SECRET` | **重新產一組**，別跟本機共用：`openssl rand -base64 32` |

`AUTH_URL` 在 Vercel **不用設定**——程式已經開了 `trustHost`，會自動用平台給的網域。

## 3. Google OAuth 回呼網址

到 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → 你的 OAuth 用戶端 ID，在「已授權的重新導向 URI」加上：

```
https://<你的專案>.vercel.app/api/auth/callback/google
```

本機那組 `http://localhost:4173/api/auth/callback/google` 保留著，兩邊都能用。

> 如果之後綁自訂網域，記得把新網域的回呼網址也加進去。

## 4. 部署後確認

- 用 Google 登入 → 到「設定」連接 Google Sheet
- 手機瀏覽器開啟 → 選單「加入主畫面」，應該會以獨立 App 的樣子開啟

## PWA 說明

- `src/app/manifest.ts` 產生 `manifest.webmanifest`
- `public/sw.js` 是 service worker，**只在 production 註冊**（開發模式跳過，免得快取擋住熱更新）
- Service worker **不會快取任何 `/api/` 請求**——那些是跟帳號綁定的私人資料，只快取圖示等靜態檔案
- 圖示是 `public/icon-192.png`、`icon-512.png`、`apple-touch-icon.png`，想換的話直接換檔即可

## 已知限制

- **「自動補齊資料」在 Hobby 方案有 60 秒上限**。書多的話一次跑不完，程式會回報「還有 N 筆，再按一次可繼續」，每本補完就立刻寫回 Sheet，所以不會白做工。升級 Pro 後可以把 `src/app/api/books/enrich/route.ts` 的 `maxDuration` 調到 300。
- `/api/scrape`（貼網址抓書籍資料）會用到無頭瀏覽器，在 Vercel 走 `@sparticuz/chromium`，冷啟動比較慢。純用書名搜尋的路徑不需要瀏覽器，速度正常。
