CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"google_sub" text,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub")
);
--> statement-breakpoint
CREATE TABLE "domain_attribute" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "domain_attribute_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "domain_record_topic" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setting_privacy_pwd" (
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	CONSTRAINT "setting_privacy_pwd_user_id_key_pk" PRIMARY KEY("user_id","key")
);
--> statement-breakpoint
CREATE TABLE "domain_writing_topic" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setting_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"field_key" text NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "setting_fields_field_key_label_unique" UNIQUE("field_key","label")
);
--> statement-breakpoint
CREATE TABLE "domain_fragments" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind_id" uuid NOT NULL,
	"work_id" uuid,
	"date" date,
	"name" text DEFAULT '' NOT NULL,
	"phrase" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"locator" text DEFAULT '' NOT NULL,
	"pronunciation" text DEFAULT '' NOT NULL,
	"translation" text DEFAULT '' NOT NULL,
	"context" text DEFAULT '' NOT NULL,
	"context_translation" text DEFAULT '' NOT NULL,
	"tags" text DEFAULT '' NOT NULL,
	"span" text DEFAULT '' NOT NULL,
	"coordinates" text DEFAULT '' NOT NULL,
	"cover_url" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain_writings" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind_id" uuid NOT NULL,
	"work_id" uuid,
	"topic_id" uuid,
	"date" date,
	"name" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"cover_url" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setting_kinds" (
	"user_id" uuid,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"group_key" text NOT NULL,
	"amount_unit" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "setting_kinds_user_id_group_key_name_unique" UNIQUE("user_id","group_key","name"),
	CONSTRAINT "setting_kinds_user_id_group_key_slug_unique" UNIQUE("user_id","group_key","slug")
);
--> statement-breakpoint
CREATE TABLE "setting_map_kind_field" (
	"user_id" uuid,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind_id" uuid NOT NULL,
	"field_key" text NOT NULL,
	"field_id" uuid NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "setting_map_kind_field_kind_id_field_key_unique" UNIQUE("kind_id","field_key")
);
--> statement-breakpoint
CREATE TABLE "domain_records" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_id" uuid NOT NULL,
	"start_date" date,
	"end_date" date,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain_works" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind_id" uuid NOT NULL,
	"title" text NOT NULL,
	"creator" text DEFAULT '' NOT NULL,
	"topic_id" uuid,
	"attribute_id" uuid,
	"language" text DEFAULT '' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"external_id" text DEFAULT '' NOT NULL,
	"cover_url" text DEFAULT '' NOT NULL,
	"amount" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links_external" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"record_id" uuid,
	"fragment_id" uuid,
	"writing_id" uuid,
	"url" text NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "links_external_exactly_one_source" CHECK ((
        ("links_external"."record_id" is not null)::int +
        ("links_external"."fragment_id" is not null)::int +
        ("links_external"."writing_id" is not null)::int
      ) = 1)
);
--> statement-breakpoint
CREATE TABLE "links_internal" (
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"a_id" uuid NOT NULL,
	"b_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "domain_attribute" ADD CONSTRAINT "domain_attribute_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_record_topic" ADD CONSTRAINT "domain_record_topic_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_record_topic" ADD CONSTRAINT "domain_record_topic_parent_id_domain_record_topic_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."domain_record_topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setting_privacy_pwd" ADD CONSTRAINT "setting_privacy_pwd_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_writing_topic" ADD CONSTRAINT "domain_writing_topic_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_writing_topic" ADD CONSTRAINT "domain_writing_topic_parent_id_domain_writing_topic_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."domain_writing_topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setting_fields" ADD CONSTRAINT "setting_fields_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_fragments" ADD CONSTRAINT "domain_fragments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_fragments" ADD CONSTRAINT "domain_fragments_kind_id_setting_kinds_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."setting_kinds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_fragments" ADD CONSTRAINT "domain_fragments_work_id_domain_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."domain_works"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_writings" ADD CONSTRAINT "domain_writings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_writings" ADD CONSTRAINT "domain_writings_kind_id_setting_kinds_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."setting_kinds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_writings" ADD CONSTRAINT "domain_writings_work_id_domain_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."domain_works"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_writings" ADD CONSTRAINT "domain_writings_topic_id_domain_writing_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."domain_writing_topic"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setting_kinds" ADD CONSTRAINT "setting_kinds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setting_map_kind_field" ADD CONSTRAINT "setting_map_kind_field_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setting_map_kind_field" ADD CONSTRAINT "setting_map_kind_field_kind_id_setting_kinds_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."setting_kinds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setting_map_kind_field" ADD CONSTRAINT "setting_map_kind_field_field_id_setting_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."setting_fields"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_records" ADD CONSTRAINT "domain_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_records" ADD CONSTRAINT "domain_records_work_id_domain_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."domain_works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_works" ADD CONSTRAINT "domain_works_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_works" ADD CONSTRAINT "domain_works_kind_id_setting_kinds_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."setting_kinds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_works" ADD CONSTRAINT "domain_works_topic_id_domain_record_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."domain_record_topic"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_works" ADD CONSTRAINT "domain_works_attribute_id_domain_attribute_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."domain_attribute"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links_external" ADD CONSTRAINT "links_external_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links_external" ADD CONSTRAINT "links_external_record_id_domain_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."domain_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links_external" ADD CONSTRAINT "links_external_fragment_id_domain_fragments_id_fk" FOREIGN KEY ("fragment_id") REFERENCES "public"."domain_fragments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links_external" ADD CONSTRAINT "links_external_writing_id_domain_writings_id_fk" FOREIGN KEY ("writing_id") REFERENCES "public"."domain_writings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links_internal" ADD CONSTRAINT "links_internal_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;