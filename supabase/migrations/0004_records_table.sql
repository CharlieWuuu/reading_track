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
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "record_kinds_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"record_id" uuid NOT NULL,
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
CREATE TABLE "records" (
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
ALTER TABLE "record_kind_fields" ADD CONSTRAINT "record_kind_fields_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_kind_fields" ADD CONSTRAINT "record_kind_fields_kind_id_record_kinds_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."record_kinds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_kind_statuses" ADD CONSTRAINT "record_kind_statuses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_kind_statuses" ADD CONSTRAINT "record_kind_statuses_kind_id_record_kinds_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."record_kinds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_kinds" ADD CONSTRAINT "record_kinds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_status_id_record_kind_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."record_kind_statuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_kind_id_record_kinds_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."record_kinds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_topic_id_book_types_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."book_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE set null ON UPDATE no action;