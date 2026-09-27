-- 卡片牆一律照年分段，不給選。
--
-- 卡片檢視改成「勾了封面圖才有」的封面牆之後，只剩有封面的類型用得到它，
-- 照年是書籍書封牆原本的做法。照月那個選項是通用化時多加的，拿掉。

ALTER TABLE setting_kinds DROP COLUMN card_group_by;
