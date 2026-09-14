CREATE TABLE "setting_user_kinds" (
	"user_id" uuid NOT NULL,
	"kind_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "setting_user_kinds_user_id_kind_id_unique" UNIQUE("user_id","kind_id")
);
--> statement-breakpoint
ALTER TABLE "setting_user_kinds" ADD CONSTRAINT "setting_user_kinds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setting_user_kinds" ADD CONSTRAINT "setting_user_kinds_kind_id_setting_kinds_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."setting_kinds"("id") ON DELETE cascade ON UPDATE no action;