-- 書寫類沒有平台：在哪讀（HyRead、Kobo）是紀錄的事，一則心得不會「在某個平台上寫」。
--
-- 正式庫的書寫類型掛著一個 platform 模組，名字是很早以前 source 欄位留下的「出處」；
-- 平台改成選單之後，它在表單上變成「選擇或新增出處」。
--
-- 只拿掉欄位設定：書寫表有 platform 欄（0019 三個 group 共用同一組欄位），
-- 填過的值留著，只是表單與詳情不再顯示。

DELETE FROM setting_map_kind_field m
USING setting_kinds k
WHERE m.kind_id = k.id
  AND k.group_key = 'writings'
  AND m.field_key = 'platform';
