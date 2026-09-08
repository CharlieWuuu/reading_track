CREATE TABLE "fragments" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind_id" uuid NOT NULL,
	"work_id" uuid,
	"name" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"locator" text DEFAULT '' NOT NULL,
	"pronunciation" text DEFAULT '' NOT NULL,
	"translation" text DEFAULT '' NOT NULL,
	"context" text DEFAULT '' NOT NULL,
	"context_translation" text DEFAULT '' NOT NULL,
	"topics" text DEFAULT '' NOT NULL,
	"span" text DEFAULT '' NOT NULL,
	"coordinates" text DEFAULT '' NOT NULL,
	"wiki_url" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "record_kind_fields" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind_id" uuid NOT NULL,
	"field_key" text NOT NULL,
	"label" text NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "record_kind_fields_kind_id_field_key_unique" UNIQUE("kind_id","field_key")
);
--> statement-breakpoint
CREATE TABLE "record_kind_statuses" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind_id" uuid NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "record_kind_statuses_kind_id_key_unique" UNIQUE("kind_id","key")
);
--> statement-breakpoint
CREATE TABLE "record_kinds" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"group_key" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "record_kinds_user_id_group_key_name_unique" UNIQUE("user_id","group_key","name")
);
--> statement-breakpoint
CREATE TABLE "records" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_id" uuid NOT NULL,
	"status_id" uuid NOT NULL,
	"start_date" date,
	"end_date" date,
	"amount" integer,
	"amount_unit" text DEFAULT '' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"source_url" text DEFAULT '' NOT NULL,
	"external_id" text DEFAULT '' NOT NULL,
	"cover_url" text DEFAULT '' NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "works" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind_id" uuid NOT NULL,
	"title" text NOT NULL,
	"creator" text DEFAULT '' NOT NULL,
	"topic_id" uuid,
	"attribute_id" uuid,
	"language" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fragments" ADD CONSTRAINT "fragments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fragments" ADD CONSTRAINT "fragments_kind_id_record_kinds_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."record_kinds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fragments" ADD CONSTRAINT "fragments_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_kind_fields" ADD CONSTRAINT "record_kind_fields_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_kind_fields" ADD CONSTRAINT "record_kind_fields_kind_id_record_kinds_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."record_kinds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_kind_statuses" ADD CONSTRAINT "record_kind_statuses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_kind_statuses" ADD CONSTRAINT "record_kind_statuses_kind_id_record_kinds_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."record_kinds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_kinds" ADD CONSTRAINT "record_kinds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_status_id_record_kind_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."record_kind_statuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_kind_id_record_kinds_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."record_kinds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_topic_id_book_types_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."book_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE set null ON UPDATE no action;