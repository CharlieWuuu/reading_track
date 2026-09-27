-- 例句與例句翻譯併進內文，兩個欄位拿掉。
--
-- 內文、例句、例句翻譯依序接起來，中間空一行；空的那段跳過。
-- 三張表同一組欄位（0019），一起併。

UPDATE "domain_fragments"
SET "body" = array_to_string(array_remove(ARRAY[
	CASE WHEN btrim("body") <> '' THEN "body" END,
	CASE WHEN btrim("example") <> '' THEN "example" END,
	CASE WHEN btrim("example_translation") <> '' THEN "example_translation" END
], NULL), E'\n\n')
WHERE btrim("example") <> '' OR btrim("example_translation") <> '';
--> statement-breakpoint
UPDATE "domain_works"
SET "body" = array_to_string(array_remove(ARRAY[
	CASE WHEN btrim("body") <> '' THEN "body" END,
	CASE WHEN btrim("example") <> '' THEN "example" END,
	CASE WHEN btrim("example_translation") <> '' THEN "example_translation" END
], NULL), E'\n\n')
WHERE btrim("example") <> '' OR btrim("example_translation") <> '';
--> statement-breakpoint
UPDATE "domain_writings"
SET "body" = array_to_string(array_remove(ARRAY[
	CASE WHEN btrim("body") <> '' THEN "body" END,
	CASE WHEN btrim("example") <> '' THEN "example" END,
	CASE WHEN btrim("example_translation") <> '' THEN "example_translation" END
], NULL), E'\n\n')
WHERE btrim("example") <> '' OR btrim("example_translation") <> '';
--> statement-breakpoint

-- 勾了例句（或翻譯）但沒勾內文的類型，補勾內文，排在例句原本的位置
INSERT INTO "setting_fields" ("user_id", "field_key", "label")
VALUES (NULL, 'longText', '內文')
ON CONFLICT ("field_key", "label") DO NOTHING;
--> statement-breakpoint
INSERT INTO "setting_map_kind_field" ("user_id", "kind_id", "field_key", "field_id", "is_visible", "sort_order")
SELECT DISTINCT ON (m."kind_id") m."user_id", m."kind_id", 'longText', f."id", m."is_visible", m."sort_order"
FROM "setting_map_kind_field" m
JOIN "setting_fields" f ON f."field_key" = 'longText' AND f."label" = '內文'
WHERE m."field_key" IN ('example', 'exampleTranslation')
ORDER BY m."kind_id", m."sort_order"
ON CONFLICT ("kind_id", "field_key") DO NOTHING;
--> statement-breakpoint
DELETE FROM "setting_map_kind_field" WHERE "field_key" IN ('example', 'exampleTranslation');
--> statement-breakpoint

ALTER TABLE "domain_fragments" DROP COLUMN "example";
--> statement-breakpoint
ALTER TABLE "domain_fragments" DROP COLUMN "example_translation";
--> statement-breakpoint
ALTER TABLE "domain_works" DROP COLUMN "example";
--> statement-breakpoint
ALTER TABLE "domain_works" DROP COLUMN "example_translation";
--> statement-breakpoint
ALTER TABLE "domain_writings" DROP COLUMN "example";
--> statement-breakpoint
ALTER TABLE "domain_writings" DROP COLUMN "example_translation";
