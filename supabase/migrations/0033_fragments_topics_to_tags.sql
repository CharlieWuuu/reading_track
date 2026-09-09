-- fragments.topics 改名 tags：跟 domain_topics（書/文章的私人分類樹）語意不同，
-- 這欄是關鍵字自己貼的自由標籤，改個名字避免混淆。

ALTER TABLE "domain_fragments" RENAME COLUMN "topics" TO "tags";
--> statement-breakpoint

-- 類型設定裡掛著 topics 欄位的（目前只有關鍵字），改指去 tags
UPDATE "setting_map_kind_field" SET "field_key" = 'tags' WHERE "field_key" = 'topics';
--> statement-breakpoint

-- fields 表存的顯示名稱也是靠 field_key 對應，一起改
UPDATE "setting_fields" SET "field_key" = 'tags' WHERE "field_key" = 'topics';
