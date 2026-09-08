-- 舊的關鍵字機制拆掉：map_book_keyword／map_article_keyword／map_writing_keyword
-- 全部是空的（沒有任何實際連結資料），keywords 主檔的 81 筆跟 fragments 裡
-- kind=關鍵字 的 81 筆完全對應——這張表本來就是重複資料，直接刪。
-- 之後書/文章/書寫的關鍵字連結一律走 internal_links。
DROP TABLE IF EXISTS "map_book_keyword";
--> statement-breakpoint
DROP TABLE IF EXISTS "map_article_keyword";
--> statement-breakpoint
DROP TABLE IF EXISTS "map_writing_keyword";
--> statement-breakpoint
DROP TABLE IF EXISTS "keywords";
