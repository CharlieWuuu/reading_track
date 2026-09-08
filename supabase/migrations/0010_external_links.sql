-- 外部連結表：書的讀墨頁面、文章的原始網址、佳句/單字/關鍵字/書寫的出處連結，
-- 六種類型共用一張表，一列一個連結（不塞陣列）。
CREATE TABLE "external_links" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" text NOT NULL,
	"source_id" uuid NOT NULL,
	"url" text NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "external_links" ADD CONSTRAINT "external_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "external_links_source_idx" ON "external_links" USING btree ("source_type","source_id");
--> statement-breakpoint
-- records.source_url 有值的每一列，搬成 external_links 一列
INSERT INTO "external_links" ("user_id", "source_type", "source_id", "url")
SELECT "user_id", 'record', "id", "source_url"
FROM "records"
WHERE "source_url" IS NOT NULL AND "source_url" != '';
--> statement-breakpoint
ALTER TABLE "records" DROP COLUMN "source_url";
