-- 版面與卡片樣式分開存。
--
-- 0025 把兩者攤平成一層（views 裡直接放 cover／fragment／quote／line），
-- 但那沒有消掉結構，只是把它藏起來：概覽底下也要排卡片，於是「用哪一種卡片」
-- 得靠「views 裡第一個卡片類的項目」去猜。
--
-- 拆回兩件正交的事：views 是整頁怎麼排（概覽、卡片牆、表格、統計），
-- card_style 是一筆長什麼樣。概覽與卡片牆都讀 card_style。

ALTER TABLE setting_kinds
	ADD COLUMN card_style text NOT NULL DEFAULT 'fragment';
--> statement-breakpoint

-- 0025 把卡片樣式併進 views，現在拆回來：views 裡那個卡片類的項目就是它
UPDATE setting_kinds
SET card_style = CASE
	WHEN views LIKE '%cover%' THEN 'cover'
	WHEN views LIKE '%quote%' THEN 'quote'
	WHEN views LIKE '%line%' THEN 'line'
	ELSE 'fragment'
END;
--> statement-breakpoint

-- 卡片類的項目換成單一的 card：原本勾了任何一種卡片，就是有卡片牆這個版面
UPDATE setting_kinds
SET views = 'overview,card' || CASE WHEN views LIKE '%table%' THEN ',table' ELSE '' END
	|| CASE WHEN views LIKE '%stats%' THEN ',stats' ELSE '' END
WHERE views LIKE '%cover%'
	OR views LIKE '%fragment%'
	OR views LIKE '%quote%'
	OR views LIKE '%line%';
