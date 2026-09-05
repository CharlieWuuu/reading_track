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
ALTER TABLE "attributes" DROP CONSTRAINT "attributes_name_unique";--> statement-breakpoint
ALTER TABLE "writing_types" DROP CONSTRAINT "writing_types_name_unique";--> statement-breakpoint
ALTER TABLE "article_keywords" DROP CONSTRAINT "article_keywords_keyword_keywords_name_fk";
--> statement-breakpoint
ALTER TABLE "book_keywords" DROP CONSTRAINT "book_keywords_keyword_keywords_name_fk";
--> statement-breakpoint
ALTER TABLE "writing_keywords" DROP CONSTRAINT "writing_keywords_keyword_keywords_name_fk";
--> statement-breakpoint
ALTER TABLE "keywords" DROP CONSTRAINT "keywords_pkey";--> statement-breakpoint
ALTER TABLE "settings" DROP CONSTRAINT "settings_pkey";--> statement-breakpoint
ALTER TABLE "attributes" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "book_types" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "keywords" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "writing_types" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "readings" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "metrics" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "writings" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "vocabulary" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "article_keywords" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "book_keywords" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "writing_keywords" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_user_id_name_pk" PRIMARY KEY("user_id","name");--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_key_pk" PRIMARY KEY("user_id","key");--> statement-breakpoint
ALTER TABLE "attributes" ADD CONSTRAINT "attributes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_types" ADD CONSTRAINT "book_types_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_types" ADD CONSTRAINT "writing_types_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readings" ADD CONSTRAINT "readings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writings" ADD CONSTRAINT "writings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocabulary" ADD CONSTRAINT "vocabulary_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_keywords" ADD CONSTRAINT "article_keywords_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_keywords" ADD CONSTRAINT "article_keywords_user_id_keyword_keywords_user_id_name_fk" FOREIGN KEY ("user_id","keyword") REFERENCES "public"."keywords"("user_id","name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "book_keywords" ADD CONSTRAINT "book_keywords_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_keywords" ADD CONSTRAINT "book_keywords_user_id_keyword_keywords_user_id_name_fk" FOREIGN KEY ("user_id","keyword") REFERENCES "public"."keywords"("user_id","name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "writing_keywords" ADD CONSTRAINT "writing_keywords_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_keywords" ADD CONSTRAINT "writing_keywords_user_id_keyword_keywords_user_id_name_fk" FOREIGN KEY ("user_id","keyword") REFERENCES "public"."keywords"("user_id","name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "attributes" ADD CONSTRAINT "attributes_user_id_name_unique" UNIQUE("user_id","name");--> statement-breakpoint
ALTER TABLE "writing_types" ADD CONSTRAINT "writing_types_user_id_name_unique" UNIQUE("user_id","name");