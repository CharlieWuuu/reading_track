-- 自訂類型（user_id 非 NULL）目前沒有 slug，用 id 前八位湊一個先頂著，
-- 使用者之後可以自己在設定裡改。回填完就收緊 NOT NULL，加上唯一約束。

UPDATE "setting_kinds" SET "slug" = 'k-' || substr("id"::text, 1, 8) WHERE "slug" IS NULL;
--> statement-breakpoint

ALTER TABLE "setting_kinds" ALTER COLUMN "slug" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "setting_kinds" ADD CONSTRAINT "setting_kinds_user_id_group_key_slug_unique"
  UNIQUE ("user_id", "group_key", "slug");
