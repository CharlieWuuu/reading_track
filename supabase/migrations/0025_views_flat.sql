-- 看法攤平成一層：一項就是一個元件。
--
-- 0022 把「一筆長什麼樣」存成 card_style、0023 把「整頁怎麼排」存成 views，
-- 兩層要對著看才知道畫出來是什麼——而且卡片只能選一種，勾了也不能切。
--
-- 攤平之後 card 那一項換成四種卡片本身：封面卡、片段卡、佳句、單行。
-- 勾幾個，那個類型頁的選單就有幾個。

-- card 換成它原本的 card_style 指的那一種
UPDATE setting_kinds
SET views = replace(views, 'card', card_style)
WHERE views LIKE '%card%';
--> statement-breakpoint

-- 本來沒有 card 那一項的，把 card_style 補進去——不然攤平後一種卡片都沒有，
-- 概覽頁的分區不知道該用哪一種畫
UPDATE setting_kinds
SET views = views || ',' || card_style
WHERE views NOT LIKE '%cover%'
	AND views NOT LIKE '%fragment%'
	AND views NOT LIKE '%quote%'
	AND views NOT LIKE '%line%';
--> statement-breakpoint

ALTER TABLE setting_kinds DROP COLUMN card_style;
