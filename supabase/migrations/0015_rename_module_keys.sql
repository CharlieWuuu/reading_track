-- 今天改了模組庫的 key，卻沒改資料庫裡「這個類型勾了哪些模組」的那張表。
-- 模組庫認不得的 key 等於沒勾：單字的解釋、例句、例句翻譯，關鍵字的解釋與生卒年，
-- 現在在表單上是消失的。對回新名字。
UPDATE setting_map_kind_field SET field_key = 'endDate' WHERE field_key = 'date';
--> statement-breakpoint
UPDATE setting_map_kind_field SET field_key = 'translation' WHERE field_key = 'gloss';
--> statement-breakpoint
UPDATE setting_map_kind_field SET field_key = 'example' WHERE field_key = 'context';
--> statement-breakpoint
UPDATE setting_map_kind_field SET field_key = 'exampleTranslation' WHERE field_key = 'contextTranslation';
--> statement-breakpoint
UPDATE setting_map_kind_field SET field_key = 'years' WHERE field_key = 'span';
--> statement-breakpoint
-- source 併進 platform 了。札記那筆若已經有 platform 就直接刪，沒有才改名
DELETE FROM setting_map_kind_field AS m
WHERE m.field_key = 'source'
  AND EXISTS (
    SELECT 1 FROM setting_map_kind_field AS m2
    WHERE m2.kind_id = m.kind_id AND m2.field_key = 'platform'
  );
--> statement-breakpoint
UPDATE setting_map_kind_field SET field_key = 'platform' WHERE field_key = 'source';
--> statement-breakpoint
-- 這兩個模組整個退休了：keywords 的關聯改走 links_internal（那是 always 的內部連結模組），
-- progress 拆成了開始日期與完成日期兩個模組
DELETE FROM setting_map_kind_field WHERE field_key IN ('keywords', 'progress');
