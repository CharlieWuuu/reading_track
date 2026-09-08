-- 書寫獨立回自己的表，不再跟佳句/單字/關鍵字擠在 fragments 裡。
-- id 沿用 fragments 現有的值，writing_keywords 才不用跟著改資料，只改外鍵指向。

CREATE TABLE "writings" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"kind_id" uuid NOT NULL,
	"work_id" uuid,
	"date" date,
	"name" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "writings" ADD CONSTRAINT "writings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "writings" ADD CONSTRAINT "writings_kind_id_kinds_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."kinds"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "writings" ADD CONSTRAINT "writings_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

INSERT INTO "writings" ("user_id", "id", "kind_id", "work_id", "date", "name", "body", "created_at")
SELECT f."user_id", f."id", f."kind_id", f."work_id", f."date", f."name", f."body", f."created_at"
FROM "fragments" f
JOIN "kinds" k ON k."id" = f."kind_id"
WHERE k."group_key" = 'writings';
--> statement-breakpoint

ALTER TABLE "writing_keywords" DROP CONSTRAINT IF EXISTS "writing_keywords_writing_id_fragments_id_fk";
--> statement-breakpoint
ALTER TABLE "writing_keywords" ADD CONSTRAINT "writing_keywords_writing_id_writings_id_fk" FOREIGN KEY ("writing_id") REFERENCES "public"."writings"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

DELETE FROM "fragments" f
USING "kinds" k
WHERE k."id" = f."kind_id" AND k."group_key" = 'writings';
