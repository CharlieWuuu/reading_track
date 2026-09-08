-- 佳句本文從 body 搬到 name，跟單字的欄位機制對齊（title 模組寫 name）。
UPDATE "fragments" f
SET "name" = f."body", "body" = ''
FROM "kinds" k
WHERE k."id" = f."kind_id" AND k."name" = '佳句';
--> statement-breakpoint

-- 既有使用者的「佳句」類型底下，欄位關聯從 oneLine 換成 title，
-- field_id 對照範本的預設名稱「原文」。
WITH title_field AS (
  INSERT INTO "fields" ("field_key", "label")
  VALUES ('title', '原文')
  ON CONFLICT ("field_key", "label") DO UPDATE SET "label" = EXCLUDED."label"
  RETURNING "id"
)
UPDATE "map_kind_field" mkf
SET "field_key" = 'title', "field_id" = (SELECT "id" FROM title_field)
FROM "kinds" k
WHERE k."id" = mkf."kind_id" AND k."name" = '佳句' AND mkf."field_key" = 'oneLine';
