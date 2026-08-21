# 待辦

## 1. 剩下沒測的純函式（低優先）

`src/testing/factories.ts` 已經有書／文章／紀事三支工廠，照著寫就好。
還沒測的：`reflections`、`record-stats`、`vocabulary-stats`、`article-stats`、
`entry-stats`、`search`、`tag-colors`。

MSW 沒導：`components/ui/` 沒有元件自己抓資料，story 也不打 API，
現在補只是養一套沒人用的 mock。等有元件層的整合測試再說。

## 2. 零碎

- `features/` 的 `index.ts` barrel：bulletproof 建議，但有 tree-shaking 代價。
  這個規模先不做
