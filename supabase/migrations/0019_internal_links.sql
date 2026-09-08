-- 站內連結：works/writings/records/fragments 任兩筆互相參照，不分型別。
-- 沒有外鍵——一個欄位沒辦法同時外鍵四張表，查詢靠 a_id/b_id 兩邊都建索引。
CREATE TABLE "internal_links" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"a_id" uuid NOT NULL,
	"b_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "internal_links" ADD CONSTRAINT "internal_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "internal_links_a_id_idx" ON "internal_links" USING btree ("a_id");
--> statement-breakpoint
CREATE INDEX "internal_links_b_id_idx" ON "internal_links" USING btree ("b_id");
