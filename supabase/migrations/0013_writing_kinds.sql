-- 共用目錄缺了書寫那三種。STARTER_KEYS 列著 reflection／thoughts／weekly-plan，
-- setting_kinds 卻只有紀錄與片段那五種——seedKinds 只寫「我在用哪些」，
-- 目錄本身沒有就無從對應。後果是新帳號看不到任何書寫類型，demo 的每日重置
-- 也在建書寫那一步失敗（清除已經跑完，資料就停在半套）。
INSERT INTO setting_kinds (user_id, name, group_key, slug, amount_unit, sort_order)
SELECT NULL, v.name, 'writings', v.slug, '字', v.sort_order
FROM (VALUES
  ('心得', 'reflection', 10),
  ('思緒', 'thoughts', 11),
  ('週計劃', 'weekly-plan', 12)
) AS v(name, slug, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM setting_kinds k WHERE k.slug = v.slug AND k.user_id IS NULL
);
--> statement-breakpoint
-- 模組要先在 setting_fields 有一列才掛得上去。全新的資料庫（測試用的那種）
-- 這張表是空的，直接取 id 會拿到 null，撞上 field_id 的 NOT NULL
INSERT INTO setting_fields (field_key, label, user_id)
SELECT v.field_key, v.label, NULL
FROM (VALUES ('title', '標題'), ('longText', '長文'), ('endDate', '完成日期')) AS v(field_key, label)
WHERE NOT EXISTS (
  SELECT 1 FROM setting_fields f WHERE f.field_key = v.field_key AND f.user_id IS NULL
);
--> statement-breakpoint
-- 這三種各自的模組：標題、長文、完成日期（跟範本 kind-templates 的定義一致）
-- setting_fields 同一個 field_key 有多列（title 五列、longText 兩列），
-- 直接 join 會把一個模組乘成好幾筆，撞上 (kind_id, field_key) 的唯一索引——取一列就好
INSERT INTO setting_map_kind_field (user_id, kind_id, field_key, field_id, sort_order)
SELECT NULL, k.id, v.field_key,
  (SELECT f.id FROM setting_fields f
    WHERE f.field_key = v.field_key AND f.user_id IS NULL ORDER BY f.id LIMIT 1),
  v.sort_order
FROM setting_kinds k
CROSS JOIN (VALUES ('title', 0), ('longText', 1), ('endDate', 2)) AS v(field_key, sort_order)
WHERE k.user_id IS NULL
  AND k.slug IN ('reflection', 'thoughts', 'weekly-plan')
  AND NOT EXISTS (
    SELECT 1 FROM setting_map_kind_field m
    WHERE m.kind_id = k.id AND m.field_key = v.field_key
  );
