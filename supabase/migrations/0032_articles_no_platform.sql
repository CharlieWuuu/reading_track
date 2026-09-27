-- 文章沒有平台：平台是閱讀媒介（實體書、Kobo），在哪個網站讀比較像出版社。
--
-- 0031 把 vocus 這類值當平台掛到文章紀錄上，這裡搬回出版社，再拿掉文章的平台欄位。

UPDATE "domain_works" w
SET "publisher" = p."name"
FROM "domain_records" r, "domain_platform" p, "setting_kinds" k
WHERE r."work_id" = w."id"
	AND p."id" = r."platform_id"
	AND k."id" = w."kind_id"
	AND k."slug" = 'articles'
	AND w."publisher" = '';
--> statement-breakpoint
UPDATE "domain_records" r
SET "platform_id" = NULL
FROM "domain_works" w, "setting_kinds" k
WHERE w."id" = r."work_id" AND k."id" = w."kind_id" AND k."slug" = 'articles';
--> statement-breakpoint
DELETE FROM "setting_map_kind_field" m
USING "setting_kinds" k
WHERE m."kind_id" = k."id" AND k."slug" = 'articles' AND m."field_key" = 'platform';
--> statement-breakpoint
-- 沒人用的平台選項清掉（選單照資料長，留著也不會出現，只是雜訊）
DELETE FROM "domain_platform" p
WHERE NOT EXISTS (SELECT 1 FROM "domain_records" r WHERE r."platform_id" = p."id")
	AND NOT EXISTS (SELECT 1 FROM "domain_fragments" f WHERE f."platform_id" = p."id")
	AND NOT EXISTS (SELECT 1 FROM "domain_writings" x WHERE x."platform_id" = p."id");
