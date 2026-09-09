-- setting_kinds 加 slug：網址上要用得到的那一段，跟中文 name 分開存。
-- 先允許 NULL，回填完六個內建類型再收緊（見下一支 migration）。

ALTER TABLE "setting_kinds" ADD COLUMN "slug" text;
--> statement-breakpoint

UPDATE "setting_kinds" SET "slug" = 'books'      WHERE "name" = '書籍'   AND "user_id" IS NULL;
--> statement-breakpoint

UPDATE "setting_kinds" SET "slug" = 'articles'   WHERE "name" = '文章'   AND "user_id" IS NULL;
--> statement-breakpoint

UPDATE "setting_kinds" SET "slug" = 'quotes'     WHERE "name" = '佳句'   AND "user_id" IS NULL;
--> statement-breakpoint

UPDATE "setting_kinds" SET "slug" = 'vocabulary' WHERE "name" = '單字'   AND "user_id" IS NULL;
--> statement-breakpoint

UPDATE "setting_kinds" SET "slug" = 'keywords'   WHERE "name" = '關鍵字' AND "user_id" IS NULL;
--> statement-breakpoint

UPDATE "setting_kinds" SET "slug" = 'writing'    WHERE "name" = '書寫'   AND "user_id" IS NULL;
