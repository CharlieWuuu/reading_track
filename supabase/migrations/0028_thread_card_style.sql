-- 卡片樣式多一種「整則」：頭像、標題、整段內文不截斷。
--
-- 書寫的概覽本來寫死畫成這樣，不管類型選了什麼樣式；資料庫裡存的 fragment
-- 只是當初的預設值，畫面從來沒照它畫。改成照樣式畫之後，書寫要維持原本的長相，
-- 就得真的存成 thread。使用者自己改過的（不是 fragment 的）不動。

UPDATE setting_kinds
SET card_style = 'thread'
WHERE group_key = 'writings' AND card_style = 'fragment';
