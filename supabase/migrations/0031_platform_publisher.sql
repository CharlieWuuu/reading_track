-- 平台與出版社分開。
--
-- works.platform 一欄混著兩種值：Kobo、實體書是平台，麥田、大塊文化是出版社。
-- 來源是 09-08 搬新表時寫的 publisher || platform，0009 又把整欄當成平台。
--
-- 平台：選項表 domain_platform，掛在每一次紀錄上——同一本書兩次可以在不同地方讀。
-- 出版社：作品的文字欄。
-- 片段與書寫跟著同一組欄位（0019），一起換。

CREATE TABLE "domain_platform" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "domain_platform_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "domain_platform" ADD CONSTRAINT "domain_platform_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "domain_records" ADD COLUMN "platform_id" uuid REFERENCES "domain_platform"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "domain_fragments" ADD COLUMN "platform_id" uuid REFERENCES "domain_platform"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "domain_writings" ADD COLUMN "platform_id" uuid REFERENCES "domain_platform"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "domain_works" ADD COLUMN "publisher" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "domain_fragments" ADD COLUMN "publisher" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "domain_writings" ADD COLUMN "publisher" text DEFAULT '' NOT NULL;
--> statement-breakpoint

-- 1. 現在的值先分：認得的平台進選項表，其餘當出版社
CREATE TEMP TABLE "_known_platform" ("name" text PRIMARY KEY);
--> statement-breakpoint
INSERT INTO "_known_platform" VALUES
	('實體書'), ('Kobo'), ('HyRead'), ('讀墨'), ('Readmoo'), ('Kindle'), ('Pubu'),
	('Google Play'), ('Apple Books'), ('Medium'), ('vocus'), ('方格子'), ('其他');
--> statement-breakpoint
INSERT INTO "domain_platform" ("user_id", "name")
SELECT DISTINCT w."user_id", btrim(w."platform")
FROM "domain_works" w
JOIN "_known_platform" k ON k."name" = btrim(w."platform")
ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "domain_records" r
SET "platform_id" = p."id"
FROM "domain_works" w, "domain_platform" p
WHERE r."work_id" = w."id"
	AND p."user_id" = w."user_id"
	AND p."name" = btrim(w."platform");
--> statement-breakpoint
UPDATE "domain_works" w
SET "publisher" = btrim(w."platform")
WHERE btrim(w."platform") <> ''
	AND NOT EXISTS (SELECT 1 FROM "_known_platform" k WHERE k."name" = btrim(w."platform"));
--> statement-breakpoint

-- 2. 缺的拿舊表補：舊表平台與出版社分兩欄存，紀錄編號沿用舊表。正式庫若已清掉就跳過
DO $$
BEGIN
	IF to_regclass('public._readings_deprecated_20260908') IS NOT NULL THEN
		INSERT INTO "domain_platform" ("user_id", "name")
		SELECT DISTINCT r."user_id", CASE WHEN btrim(o."platform") = 'Hyread' THEN 'HyRead' ELSE btrim(o."platform") END
		FROM "_readings_deprecated_20260908" o
		JOIN "domain_records" r ON r."id" = o."id"
		WHERE btrim(o."platform") <> '' AND r."platform_id" IS NULL
		ON CONFLICT DO NOTHING;

		UPDATE "domain_records" r
		SET "platform_id" = p."id"
		FROM "_readings_deprecated_20260908" o, "domain_platform" p
		WHERE o."id" = r."id"
			AND r."platform_id" IS NULL
			AND p."user_id" = r."user_id"
			AND p."name" = CASE WHEN btrim(o."platform") = 'Hyread' THEN 'HyRead' ELSE btrim(o."platform") END;

		UPDATE "domain_works" w
		SET "publisher" = s."publisher"
		FROM (
			SELECT DISTINCT ON (r."work_id") r."work_id", btrim(o."publisher") AS "publisher"
			FROM "_readings_deprecated_20260908" o
			JOIN "domain_records" r ON r."id" = o."id"
			WHERE btrim(o."publisher") <> ''
			ORDER BY r."work_id", o."created_at"
		) s
		WHERE s."work_id" = w."id" AND w."publisher" = '';
	END IF;
END $$;
--> statement-breakpoint

-- 3. 片段與書寫的平台值全進選項表（0030 起書寫不顯示，值還在）
INSERT INTO "domain_platform" ("user_id", "name")
SELECT DISTINCT "user_id", btrim("platform") FROM "domain_fragments" WHERE btrim("platform") <> ''
UNION
SELECT DISTINCT "user_id", btrim("platform") FROM "domain_writings" WHERE btrim("platform") <> ''
ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "domain_fragments" f
SET "platform_id" = p."id"
FROM "domain_platform" p
WHERE p."user_id" = f."user_id" AND p."name" = btrim(f."platform");
--> statement-breakpoint
UPDATE "domain_writings" f
SET "platform_id" = p."id"
FROM "domain_platform" p
WHERE p."user_id" = f."user_id" AND p."name" = btrim(f."platform");
--> statement-breakpoint
ALTER TABLE "domain_works" DROP COLUMN "platform";
--> statement-breakpoint
ALTER TABLE "domain_fragments" DROP COLUMN "platform";
--> statement-breakpoint
ALTER TABLE "domain_writings" DROP COLUMN "platform";
--> statement-breakpoint

-- 4. 類型設定：勾了平台的類型一起勾出版社；平台被叫成「出版社」的改回「平台」
INSERT INTO "setting_fields" ("user_id", "field_key", "label")
VALUES (NULL, 'publisher', '出版社'), (NULL, 'platform', '平台')
ON CONFLICT ("field_key", "label") DO NOTHING;
--> statement-breakpoint
UPDATE "setting_map_kind_field" m
SET "sort_order" = m."sort_order" + 1
FROM "setting_map_kind_field" p
WHERE p."kind_id" = m."kind_id" AND p."field_key" = 'platform' AND m."sort_order" > p."sort_order"
	AND NOT EXISTS (SELECT 1 FROM "setting_map_kind_field" x WHERE x."kind_id" = m."kind_id" AND x."field_key" = 'publisher');
--> statement-breakpoint
INSERT INTO "setting_map_kind_field" ("user_id", "kind_id", "field_key", "field_id", "is_visible", "sort_order")
SELECT m."user_id", m."kind_id", 'publisher', f."id", m."is_visible", m."sort_order" + 1 -- 緊接在平台後面
FROM "setting_map_kind_field" m
JOIN "setting_fields" f ON f."field_key" = 'publisher' AND f."label" = '出版社'
WHERE m."field_key" = 'platform'
ON CONFLICT ("kind_id", "field_key") DO NOTHING;
--> statement-breakpoint
UPDATE "setting_map_kind_field" m
SET "field_id" = (SELECT "id" FROM "setting_fields" WHERE "field_key" = 'platform' AND "label" = '平台')
FROM "setting_fields" old
WHERE m."field_key" = 'platform' AND old."id" = m."field_id" AND old."label" = '出版社';
