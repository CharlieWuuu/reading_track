-- 「自己沒封面時要不要用出處的封面」本來寫死在查詢裡判斷 slug === "keywords"，
-- 自訂類型沒得選——使用者新增一種「語錄」想跟著書封，只能改程式。改成類型自己說。
ALTER TABLE "setting_kinds" ADD COLUMN IF NOT EXISTS "inherits_cover" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
-- 佳句與整個書寫 group 繼承出處封面：那句話、那篇心得本來就長在那本書上。
-- 單字與關鍵字不繼承——一個詞不屬於任何一本書。
UPDATE "setting_kinds" SET "inherits_cover" = true
WHERE "group_key" = 'writings' OR "slug" = 'quotes';
