-- 一個類型有哪幾種看法，變成它自己的設定。
--
-- 本來寫死在 records/books 與 records/articles 兩支頁面檔裡（各一份 modes 清單），
-- 所以只有書籍與文章點進去有檢視切換，自訂類型永遠只有一種看法。
--
-- 預設 'overview'：一種都沒有的話頁面畫不出東西。既有的按現況補齊。

ALTER TABLE setting_kinds
	ADD COLUMN views text NOT NULL DEFAULT 'overview';
--> statement-breakpoint

-- 書籍與文章本來就四種全開
UPDATE setting_kinds
SET views = 'overview,table,card,stats'
WHERE slug IN ('books', 'articles');
--> statement-breakpoint

-- 單字本來是概覽／表格／統計三種
UPDATE setting_kinds SET views = 'overview,table,stats' WHERE slug = 'vocabulary';
--> statement-breakpoint

-- 佳句與關鍵字本來走通用選單的預設：清單與統計
UPDATE setting_kinds SET views = 'overview,stats' WHERE slug IN ('quotes', 'keywords');
--> statement-breakpoint

-- 其餘（書寫那一批與自訂類型）本來沒有切換鈕，維持單一看法就是預設值 'overview'，
-- 但表格對它們一樣畫得出來，補上去才不是二等公民
UPDATE setting_kinds
SET views = 'overview,table'
WHERE views = 'overview' AND group_key = 'writings';
