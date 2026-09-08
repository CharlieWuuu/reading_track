-- fields 改成全體共用：不同使用者本來就會打出同一個 field_key/label 組合
-- （書名叫「標題」不分人），拆掉 user_id，靠 (field_key, label) 去重就夠。

-- 每組 (field_key, label) 留 id 最小的那一列當代表，map_kind_field 全部改指過去。
WITH keep AS (
  SELECT DISTINCT ON ("field_key", "label") "id", "field_key", "label"
  FROM "fields"
  ORDER BY "field_key", "label", "id"
)
UPDATE "map_kind_field" mkf
SET "field_id" = keep."id"
FROM "fields" f
JOIN keep ON keep."field_key" = f."field_key" AND keep."label" = f."label"
WHERE f."id" = mkf."field_id";
--> statement-breakpoint

-- 沒有任何 map_kind_field 指到的重複列，刪掉
DELETE FROM "fields" f
WHERE f."id" NOT IN (
  SELECT DISTINCT ON ("field_key", "label") "id"
  FROM "fields"
  ORDER BY "field_key", "label", "id"
);
--> statement-breakpoint

ALTER TABLE "fields" DROP CONSTRAINT IF EXISTS "fields_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "fields" DROP CONSTRAINT IF EXISTS "fields_user_id_field_key_label_unique";
--> statement-breakpoint
ALTER TABLE "fields" DROP COLUMN "user_id";
--> statement-breakpoint
ALTER TABLE "fields" ADD CONSTRAINT "fields_field_key_label_unique" UNIQUE("field_key","label");
