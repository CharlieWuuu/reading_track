-- 模組名稱一致：範本不再替各類型改名，既有類型改回模組庫的預設名。
--
-- 只換範本當初給的名字與舊預設名；使用者在設定頁自己取的不動。

-- 新名字還沒有那一列就補上
INSERT INTO setting_fields (field_key, label)
SELECT DISTINCT r.field_key, r.new_label FROM (VALUES
  ('title', '詞條', '標題'), ('title', '原文', '標題'), ('title', '單字', '標題'),
  ('creator', '作者／來源人', '作者'), ('creator', '導演', '作者'), ('creator', '主持人', '作者'),
  ('creator', '頻道', '作者'), ('creator', '策展人', '作者'), ('creator', '講師', '作者'),
  ('longText', '長文', '內文'), ('longText', '摘要', '內文'), ('longText', '維基摘要', '內文'),
  ('amount', '量', '數量'), ('amount', '頁數', '數量'), ('amount', '字數', '數量'),
  ('amount', '片長', '數量'), ('amount', '時長', '數量'), ('amount', '時數', '數量'),
  ('translation', '字義', '解釋'),
  ('externalUrl', '維基連結', '外部連結'), ('externalUrl', '官網', '外部連結'),
  ('tags', '學科', '標籤'), ('externalId', 'ISBN', '外部編號'), ('platform', '媒體', '平台')
) AS r (field_key, old_label, new_label)
ON CONFLICT (field_key, label) DO NOTHING;
--> statement-breakpoint

UPDATE setting_map_kind_field m
SET field_id = target.id
FROM setting_fields old, (VALUES
  ('title', '詞條', '標題'), ('title', '原文', '標題'), ('title', '單字', '標題'),
  ('creator', '作者／來源人', '作者'), ('creator', '導演', '作者'), ('creator', '主持人', '作者'),
  ('creator', '頻道', '作者'), ('creator', '策展人', '作者'), ('creator', '講師', '作者'),
  ('longText', '長文', '內文'), ('longText', '摘要', '內文'), ('longText', '維基摘要', '內文'),
  ('amount', '量', '數量'), ('amount', '頁數', '數量'), ('amount', '字數', '數量'),
  ('amount', '片長', '數量'), ('amount', '時長', '數量'), ('amount', '時數', '數量'),
  ('translation', '字義', '解釋'),
  ('externalUrl', '維基連結', '外部連結'), ('externalUrl', '官網', '外部連結'),
  ('tags', '學科', '標籤'), ('externalId', 'ISBN', '外部編號'), ('platform', '媒體', '平台')
) AS r (field_key, old_label, new_label), setting_fields target
WHERE m.field_id = old.id
  AND old.field_key = r.field_key AND old.label = r.old_label
  AND target.field_key = r.field_key AND target.label = r.new_label;
