-- 出版社改叫「發行」：書有出版社，文章是媒體、電影是片商，「發行」都講得通。
-- 使用者自己改過的名字不動，只換還叫「出版社」的那些（0031 預設給的）。

INSERT INTO "setting_fields" ("user_id", "field_key", "label")
VALUES (NULL, 'publisher', '發行')
ON CONFLICT ("field_key", "label") DO NOTHING;
--> statement-breakpoint
UPDATE "setting_map_kind_field" m
SET "field_id" = (SELECT "id" FROM "setting_fields" WHERE "field_key" = 'publisher' AND "label" = '發行')
FROM "setting_fields" old
WHERE m."field_key" = 'publisher' AND old."id" = m."field_id" AND old."label" = '出版社';
