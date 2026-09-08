-- 表名依領域分前綴：domain_（核心資料）、setting_（類型/欄位設定）、links_（連結）。
ALTER TABLE "works" RENAME TO "domain_works";
--> statement-breakpoint
ALTER TABLE "records" RENAME TO "domain_records";
--> statement-breakpoint
ALTER TABLE "fragments" RENAME TO "domain_fragments";
--> statement-breakpoint
ALTER TABLE "writings" RENAME TO "domain_writings";
--> statement-breakpoint
ALTER TABLE "topics" RENAME TO "domain_topics";
--> statement-breakpoint
ALTER TABLE "book_attributes" RENAME TO "domain_work_attributes";
--> statement-breakpoint

ALTER TABLE "kinds" RENAME TO "setting_kinds";
--> statement-breakpoint
ALTER TABLE "fields" RENAME TO "setting_fields";
--> statement-breakpoint
ALTER TABLE "map_kind_field" RENAME TO "setting_map_kind_field";
--> statement-breakpoint

ALTER TABLE "external_links" RENAME TO "links_external";
--> statement-breakpoint
ALTER TABLE "internal_links" RENAME TO "links_internal";
