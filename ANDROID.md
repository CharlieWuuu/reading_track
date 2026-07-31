# 上架 Android（TWA）

把已部署的 PWA 包成 Trusted Web Activity，程式碼不需要另外寫一份 Android app。

## 先決條件

- 網站已部署在 HTTPS 網域，`/manifest.webmanifest` 與 `/privacy` 都打得開
- Google OAuth 已通過驗證（用了 `spreadsheets` 這個敏感範圍，未驗證只能給測試帳號用）
- Play Console 開發者帳號（一次性 25 美金）
- 本機有 JDK 17 與 Node

## 1. 產生 Android 專案

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://<你的網域>/manifest.webmanifest
```

互動式問題的建議答案：

| 問題 | 填什麼 |
| --- | --- |
| Application ID | `com.<你的網域反寫>.readingtrack`，決定後不能改 |
| Display mode | `standalone` |
| Status bar color | `#ffffff`（跟 manifest 的 `theme_color` 一致） |
| Include support for Play Billing | No |

`versionName` 用 `package.json` 的 `version`，`versionCode` 用遞增整數。**每次上傳 `versionCode` 都必須比上一次大**，否則 Play 直接拒收。

## 2. 建置與簽章

```bash
bubblewrap build
```

第一次會產生 keystore。**這個 keystore 檔案與密碼要備份**，弄丟就無法再更新這個 app，只能換 Application ID 重新上架。

## 3. 綁定網域（拿掉網址列）

沒有這一步，app 開起來上方會顯示網址列，看起來就不像原生 app。

```bash
bubblewrap fingerprint list
```

把印出的 SHA-256 指紋填進 `public/.well-known/assetlinks.json`（見該檔案的 `TODO`），重新部署網站。Play 用「Play 應用程式簽署」時，指紋要改用 Play Console → 發布 → 設定 → 應用程式完整性 頁面上的那一組。

驗證：

```bash
curl https://<你的網域>/.well-known/assetlinks.json
```

## 4. 上傳 Play Console

- 上傳 `app-release-bundle.aab`
- 隱私權政策網址填 `https://<你的網域>/privacy`
- 資料安全表單：勾選會存取「檔案與文件」，用途是 app 功能，資料存在使用者自己的 Google 試算表、不由本服務保存
- 帳號刪除：說明登出即清除登入狀態，撤銷授權在 Google 帳號頁面，內容刪除等同刪除使用者自己的試算表
- 先發到「內部測試」軌道確認能裝、能登入，再推正式版

## 常見退件原因

- **最低功能性**：純網站外殼可能被認為沒有原生價值。補上捷徑（manifest 的 `shortcuts` 已經有）、推播或分享功能可以降低風險。
- **未通過 OAuth 驗證**：測試模式下非測試帳號登入會看到警告畫面，審查員會踩到。

## 改版流程

1. 更新 `package.json` 的 `version`
2. 部署網站
3. `bubblewrap update && bubblewrap build`，`versionCode` 遞增
4. 上傳新的 AAB

網頁內容的修改不需要重新送審，使用者下次開啟就會拿到新版；只有 Android 殼本身（圖示、名稱、權限）改動才要重新上傳。
