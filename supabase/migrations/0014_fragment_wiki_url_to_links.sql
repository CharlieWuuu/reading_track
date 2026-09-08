-- fragments.wiki_url（關鍵字的維基連結、書寫的發布連結）搭進 external_links，
-- 跟 records.source_url 共用同一套機制。
INSERT INTO "external_links" ("user_id", "source_type", "source_id", "url")
SELECT "user_id", 'fragment', "id", "wiki_url"
FROM "fragments"
WHERE "wiki_url" IS NOT NULL AND "wiki_url" != '';
--> statement-breakpoint
ALTER TABLE "fragments" DROP COLUMN "wiki_url";
