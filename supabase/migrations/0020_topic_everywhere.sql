-- 領域與屬性也讓片段與書寫用。
--
-- 0019 把三張表補成同一組欄位，但漏了這兩個——它們存的是別張表的編號
-- （domain_record_topic、domain_attribute），當時被當成「不落在自己欄位上」
-- 跳過了。結果是設定頁的「領域」「屬性」對片段與書寫還是假的：
-- 勾得到、存不下、不報錯。
--
-- 領域樹本身還是一人一份（每個帳號自己的 domain_record_topic），
-- 這裡只是讓三個 group 都指得到它。

ALTER TABLE "domain_fragments"
	ADD COLUMN IF NOT EXISTS "topic_id" uuid REFERENCES "domain_record_topic"("id") ON DELETE SET NULL,
	ADD COLUMN IF NOT EXISTS "attribute_id" uuid REFERENCES "domain_attribute"("id") ON DELETE SET NULL;
--> statement-breakpoint

ALTER TABLE "domain_writings"
	ADD COLUMN IF NOT EXISTS "topic_id" uuid REFERENCES "domain_record_topic"("id") ON DELETE SET NULL,
	ADD COLUMN IF NOT EXISTS "attribute_id" uuid REFERENCES "domain_attribute"("id") ON DELETE SET NULL;
