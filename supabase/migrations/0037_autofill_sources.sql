-- 類型可以勾「自動補齊」的來源，表單才知道要不要出按鈕。
--
-- 逗號相接的 slug，空字串＝不出按鈕。書籍與關鍵字先套上原本就有的來源。

ALTER TABLE "setting_kinds" ADD COLUMN IF NOT EXISTS "autofill_sources" text DEFAULT '' NOT NULL;
--> statement-breakpoint
UPDATE "setting_kinds" SET "autofill_sources" = 'books' WHERE "group_key" = 'records' AND "slug" = 'books';
--> statement-breakpoint
UPDATE "setting_kinds" SET "autofill_sources" = 'wikipedia' WHERE "group_key" = 'fragments' AND "slug" = 'keywords';
