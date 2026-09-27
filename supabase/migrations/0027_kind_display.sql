-- 類型的顯示設定：卡片牆分段、重讀計次、讀完編號。
--
-- 本來寫死在書籍專屬頁（records/books），其他類型都沒有。
-- 改成類型自己的設定，書籍照原本的樣子補上。

ALTER TABLE setting_kinds
	ADD COLUMN card_group_by text NOT NULL DEFAULT 'month',
	ADD COLUMN count_rereads boolean NOT NULL DEFAULT false,
	ADD COLUMN number_done boolean NOT NULL DEFAULT false;
--> statement-breakpoint

UPDATE setting_kinds
SET card_group_by = 'year', count_rereads = true, number_done = true
WHERE slug = 'books';
