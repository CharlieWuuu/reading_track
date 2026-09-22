-- 清單上一筆長什麼樣，變成類型自己的設定。
--
-- 本來寫死判斷 slug = 'quotes' 才排成引文，其餘一律卡片牆——所以使用者自己
-- 新增的「語錄」「金句」排不成佳句，自訂類型在這件事上是二等公民。
--
-- 預設 'fragment'：片段與書寫本來就走卡片牆，這樣既有資料不動也對。
-- 紀錄那一批改成 'cover'（它們本來就畫成封面卡），quotes 改成 'quote'。

ALTER TABLE setting_kinds
	ADD COLUMN card_style text NOT NULL DEFAULT 'fragment';
--> statement-breakpoint

-- 紀錄一律封面卡：書籍、電影、線上課程本來就是這樣畫的
UPDATE setting_kinds SET card_style = 'cover' WHERE group_key = 'records';
--> statement-breakpoint

-- 認 slug 不認編號：每個帳號各有自己的一列，寫死 id 只在某一個資料庫成立
UPDATE setting_kinds SET card_style = 'quote' WHERE slug = 'quotes';
