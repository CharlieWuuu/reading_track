-- 佳句本文獨立成 phrase 欄位，跟單字的 name（單字本身）分開。
ALTER TABLE "fragments" ADD COLUMN "phrase" text DEFAULT '' NOT NULL;
--> statement-breakpoint

UPDATE "fragments" f
SET "phrase" = f."name", "name" = ''
FROM "kinds" k
WHERE k."id" = f."kind_id" AND k."name" = '佳句';
