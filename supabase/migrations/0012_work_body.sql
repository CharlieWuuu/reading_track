-- 紀錄可以寫摘要：這一筆在講什麼。客觀的內容簡介，不是讀後的感想——
-- 感想是書寫 group 的「心得」，會單獨列出來看、會想發布；摘要只是作品的附註。
-- 掛在 works 不掛 records：同一本書讀第二次，它在講什麼不會變。
ALTER TABLE "domain_works" ADD COLUMN IF NOT EXISTS "body" text DEFAULT '' NOT NULL;
--> statement-breakpoint
-- 模組庫有 longText，setting_fields 不一定有對應的那一列——先補上才掛得了。
-- user_id 是 null 代表全站共用的預設，跟其他內建模組一樣
INSERT INTO setting_fields (field_key, label, user_id)
SELECT 'longText', '長文', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM setting_fields WHERE field_key = 'longText' AND user_id IS NULL
);
--> statement-breakpoint
-- 既有的書籍與文章補上這個模組（範本只對新開的類型生效）。
-- sort_order 接在該類型現有的最後面，field_id 指到上面那一列
INSERT INTO setting_map_kind_field (user_id, kind_id, field_key, field_id, sort_order)
SELECT
  k.user_id,
  k.id,
  'longText',
  (SELECT f.id FROM setting_fields f WHERE f.field_key = 'longText' AND f.user_id IS NULL LIMIT 1),
  COALESCE((SELECT MAX(m2.sort_order) + 1 FROM setting_map_kind_field m2 WHERE m2.kind_id = k.id), 0)
FROM setting_kinds k
WHERE k.name IN ('書籍', '文章')
  AND NOT EXISTS (
    SELECT 1 FROM setting_map_kind_field m
    WHERE m.kind_id = k.id AND m.field_key = 'longText'
  );
--> statement-breakpoint
-- 今天改名留下的死鍵：publisher 併進 platform、link 改叫 externalUrl，
-- 模組庫已經沒有這兩個 key，留著只會在勾選清單裡對不到東西。
-- 已經有 platform 的（書籍）直接刪掉 publisher，沒有的（文章）改名過去。
DELETE FROM setting_map_kind_field AS m
WHERE m.field_key = 'publisher'
  AND EXISTS (
    SELECT 1 FROM setting_map_kind_field AS m2
    WHERE m2.kind_id = m.kind_id AND m2.field_key = 'platform'
  );
--> statement-breakpoint
UPDATE setting_map_kind_field SET field_key = 'platform' WHERE field_key = 'publisher';
--> statement-breakpoint
UPDATE setting_map_kind_field SET field_key = 'externalUrl' WHERE field_key = 'link';
