-- 領域每個類型都要有：還沒勾的補勾，排在最後。改過名字的不動。

INSERT INTO "setting_fields" ("user_id", "field_key", "label")
VALUES (NULL, 'topic', '領域')
ON CONFLICT ("field_key", "label") DO NOTHING;
--> statement-breakpoint
INSERT INTO "setting_map_kind_field" ("user_id", "kind_id", "field_key", "field_id", "is_visible", "sort_order")
SELECT k."user_id", k."id", 'topic', f."id", true,
	COALESCE((SELECT max(m."sort_order") + 1 FROM "setting_map_kind_field" m WHERE m."kind_id" = k."id"), 0)
FROM "setting_kinds" k
JOIN "setting_fields" f ON f."field_key" = 'topic' AND f."label" = '領域'
WHERE NOT EXISTS (
	SELECT 1 FROM "setting_map_kind_field" m WHERE m."kind_id" = k."id" AND m."field_key" = 'topic'
)
ON CONFLICT ("kind_id", "field_key") DO NOTHING;
