# 視覺參考

設計稿（canvas）：https://claude.ai/code/artifact/bd10df68-9cf6-424f-a60f-561ae11e4f18

外部作品，只當參考，別散出去。新圖丟這個資料夾，檔名照 `類型-來源-主題.png`。

## 想要的（照抄得動）

| 圖 | 學什麼 | 網頁上能不能做 |
|---|---|---|
| `magazine-jingye-cover.png` | 直排標題、大留白、細線分隔、無彩＋一點自然色 | 直排只適合單一標題，不能整頁 |
| `web-selfesteem-editorial.png` | 報紙分欄＋垂直細線、序號 1／2、超大標題壓小內文 | 桌機可以；手機分欄要塌成單欄 |
| `web-wanderlust-brutalism.png` | 一格一格的方格線（不是卡片陰影）、01–04 編號、小型全大寫標籤 | 可以，線比框省空間 |
| `app-annak-profile.png` | 手機上的雜誌感：全大寫小標籤＋一條線、大數字、無彩 | 最貼近本專案，直接可用 |
| `print-tokyopaper-spread.png` | 報頭大、內文小、大圖壓版、目錄式編號 | 桌機最接近；手機要拆 |
| `web-architecture-magazine.png` | 首字放大、細長襯線標題、橫向捲動 | 首字放大可以，橫捲不做 |
| `web-fylla-article.png` | 標題大、右側細欄放 meta、章節標題小 | 詳情頁直接套 |
| `web-eth-teaching.png` | 左欄分類、細線分隔、無底色 | 側欄版就是照它 |
| `app-lighting-mono.png` | 單色、粗黑標題、圖表只用線 | 可以，但等寬字要慎選中文 fallback |
| `web-smarthome-bento.png` | bento：大小格混排，一眼看完多種資料 | 可以，首頁與統計適合 |

## Logo 參考（他要的手感）

`icon-bookshelf-flat.png`、`icon-newspaper-line.png`、`icon-newspaper-sketch.png`、`icon-newspaper-sketch2.png`

這幾張是他找的插畫感書櫃／報紙。結論：手繪路線我畫不好，logo 定案走「報頭本身」——襯線站名夾在三條線之間，小尺寸只留線與一個 A。

## 拿來對照的（方向相反）

`dash-sparkpixel.png`、`dash-carlic.png`、`dash-health-lime.png`、`web-arkitect-article.png`

卡片陰影、圓角、彩色徽章、螢光重點色——跟「砍掉卡片框、近乎無彩」的定案衝突。留著是為了討論「資訊密度」怎麼在不用卡片的前提下達成。

## 目前的設計語彙（2026-09-07）

報頭雙線（3px + 1.4px）・全大寫小標籤配實線・細線分隔不用卡片框・
襯線值配無襯線標籤・右側窄欄放固定長度的清單・狀態靠一顆點的深淺・
字級對比要強：站名 40 → 頁名 30 → 頭條 34 → 條目 17／15／13.5 → meta 11。

分類：紀錄（書籍・文章・電影…）｜片段（佳句・單字・關鍵字）｜專欄（日記・心得・論述）｜統計。
類型是資料不是程式，新增類型＝勾模組。
