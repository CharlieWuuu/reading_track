-- note 併入 body：佳句的心得跟關鍵字的摘要本來就不會同時出現在同一列，
-- 兩個欄位合一，不用各自留一個大多是空的欄位。

UPDATE "domain_fragments" SET "body" = "note" WHERE "note" <> '';
--> statement-breakpoint

ALTER TABLE "domain_fragments" DROP COLUMN "note";
--> statement-breakpoint

-- 類型設定裡掛著 note 欄位的（目前只有佳句），改指去 body；
-- 同一個類型若兩個都掛了才會撞 unique(kind_id, field_key)，那種先把舊的 note 那列丟掉。
DELETE FROM "setting_map_kind_field" mkf
USING "setting_map_kind_field" other
WHERE mkf."field_key" = 'note'
  AND other."kind_id" = mkf."kind_id"
  AND other."field_key" = 'body';
--> statement-breakpoint

-- field_id 指去 fields 表裡「field_key='body'、同一個顯示名稱」那一列；沒有就補一筆
INSERT INTO "setting_fields" ("user_id", "field_key", "label")
SELECT DISTINCT f."user_id", 'body', f."label"
FROM "setting_map_kind_field" mkf
JOIN "setting_fields" f ON f."id" = mkf."field_id"
WHERE mkf."field_key" = 'note'
ON CONFLICT ("field_key", "label") DO NOTHING;
--> statement-breakpoint

UPDATE "setting_map_kind_field" mkf
SET "field_key" = 'body',
    "field_id" = body_field.id
FROM "setting_fields" old_field, "setting_fields" body_field
WHERE mkf."field_key" = 'note'
  AND old_field."id" = mkf."field_id"
  AND body_field."field_key" = 'body'
  AND body_field."label" = old_field."label";
