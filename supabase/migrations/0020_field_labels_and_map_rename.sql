-- fields：欄位顯示名稱去重，同一個 field_key 下相同的字串只存一次。
CREATE TABLE "fields" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
	"field_key" text NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "fields_user_id_field_key_label_unique" UNIQUE("user_id","field_key","label")
);
--> statement-breakpoint
ALTER TABLE "fields" ADD CONSTRAINT "fields_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- 空字串一律當「沒自訂」，用 config/modules.ts 的預設中文名稱補（下面 CASE 跟
-- modules.ts 保持一致）。resolved 算好之後才 DISTINCT，不然空字串跟補齊後剛好
-- 撞名的那幾筆（例如 keywords 空字串補成「關鍵字」，剛好也有人自己打「關鍵字」）
-- 會各自去重、繞過 unique constraint。
WITH resolved AS (
  SELECT "user_id", "field_key",
    CASE WHEN "label" = '' THEN
      CASE "field_key"
        WHEN 'title' THEN '標題'
        WHEN 'creator' THEN '作者／來源人'
        WHEN 'longText' THEN '長文'
        WHEN 'oneLine' THEN '一句話'
        WHEN 'gloss' THEN '解釋'
        WHEN 'source' THEN '出處'
        WHEN 'locator' THEN '位置'
        WHEN 'cover' THEN '封面圖'
        WHEN 'link' THEN '外部連結'
        WHEN 'progress' THEN '狀態'
        WHEN 'date' THEN '單一日期'
        WHEN 'keywords' THEN '關鍵字'
        WHEN 'amount' THEN '量＋單位'
        WHEN 'private' THEN '私人'
        ELSE "field_key"
      END
    ELSE "label" END AS "label"
  FROM "kind_fields"
)
INSERT INTO "fields" ("user_id", "field_key", "label")
SELECT DISTINCT "user_id", "field_key", "label" FROM resolved;
--> statement-breakpoint

ALTER TABLE "kind_fields" ADD COLUMN "field_id" uuid;
--> statement-breakpoint
UPDATE "kind_fields" kf
SET "field_id" = f."id"
FROM "fields" f
WHERE f."user_id" = kf."user_id"
  AND f."field_key" = kf."field_key"
  AND f."label" = CASE WHEN kf."label" = '' THEN
    CASE kf."field_key"
      WHEN 'title' THEN '標題'
      WHEN 'creator' THEN '作者／來源人'
      WHEN 'longText' THEN '長文'
      WHEN 'oneLine' THEN '一句話'
      WHEN 'gloss' THEN '解釋'
      WHEN 'source' THEN '出處'
      WHEN 'locator' THEN '位置'
      WHEN 'cover' THEN '封面圖'
      WHEN 'link' THEN '外部連結'
      WHEN 'progress' THEN '狀態'
      WHEN 'date' THEN '單一日期'
      WHEN 'keywords' THEN '關鍵字'
      WHEN 'amount' THEN '量＋單位'
      WHEN 'private' THEN '私人'
      ELSE kf."field_key"
    END
  ELSE kf."label" END;
--> statement-breakpoint

ALTER TABLE "kind_fields" ALTER COLUMN "field_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "kind_fields" ADD CONSTRAINT "kind_fields_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "kind_fields" DROP COLUMN "label";
--> statement-breakpoint

ALTER TABLE "kind_fields" RENAME TO "map_kind_field";
--> statement-breakpoint
ALTER TABLE "book_keywords" RENAME TO "map_book_keyword";
--> statement-breakpoint
ALTER TABLE "article_keywords" RENAME TO "map_article_keyword";
--> statement-breakpoint
ALTER TABLE "writing_keywords" RENAME TO "map_writing_keyword";
