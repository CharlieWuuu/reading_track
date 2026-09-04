CREATE TABLE "attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "attributes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "book_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keywords" (
	"name" text PRIMARY KEY NOT NULL,
	"topics" text DEFAULT '' NOT NULL,
	"coordinates" text DEFAULT '' NOT NULL,
	"span" text DEFAULT '' NOT NULL,
	"wiki_url" text DEFAULT '' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	CONSTRAINT "writing_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"author" text DEFAULT '' NOT NULL,
	"platform" text DEFAULT '' NOT NULL,
	"source_url" text DEFAULT '' NOT NULL,
	"end_date" date,
	"type_id" uuid,
	"attribute_id" uuid,
	"language" text DEFAULT '' NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"author" text DEFAULT '' NOT NULL,
	"type_id" uuid,
	"attribute_id" uuid,
	"language" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"status" text NOT NULL,
	"start_date" date,
	"end_date" date,
	"isbn" text DEFAULT '' NOT NULL,
	"platform" text DEFAULT '' NOT NULL,
	"publisher" text DEFAULT '' NOT NULL,
	"page_count" integer,
	"word_count" integer,
	"source_url" text DEFAULT '' NOT NULL,
	"cover_url" text DEFAULT '' NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"writing_id" uuid NOT NULL,
	"date" date NOT NULL,
	"platform" text DEFAULT '' NOT NULL,
	"views" integer,
	"reads" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid,
	"article_id" uuid,
	"type_id" uuid,
	"title" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"date" date,
	"link" text DEFAULT '' NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "one_source" CHECK ("writings"."book_id" is null or "writings"."article_id" is null)
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid,
	"text" text NOT NULL,
	"chapter" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocabulary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid,
	"word" text NOT NULL,
	"pronunciation" text DEFAULT '' NOT NULL,
	"word_translation" text DEFAULT '' NOT NULL,
	"sentence" text DEFAULT '' NOT NULL,
	"sentence_translation" text DEFAULT '' NOT NULL,
	"chapter" text DEFAULT '' NOT NULL,
	"language" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_keywords" (
	"article_id" uuid NOT NULL,
	"keyword" text NOT NULL,
	CONSTRAINT "article_keywords_article_id_keyword_pk" PRIMARY KEY("article_id","keyword")
);
--> statement-breakpoint
CREATE TABLE "book_keywords" (
	"book_id" uuid NOT NULL,
	"keyword" text NOT NULL,
	CONSTRAINT "book_keywords_book_id_keyword_pk" PRIMARY KEY("book_id","keyword")
);
--> statement-breakpoint
CREATE TABLE "writing_keywords" (
	"writing_id" uuid NOT NULL,
	"keyword" text NOT NULL,
	CONSTRAINT "writing_keywords_writing_id_keyword_pk" PRIMARY KEY("writing_id","keyword")
);
--> statement-breakpoint
ALTER TABLE "book_types" ADD CONSTRAINT "book_types_parent_id_book_types_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."book_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_type_id_book_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."book_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_type_id_book_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."book_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readings" ADD CONSTRAINT "readings_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_writing_id_writings_id_fk" FOREIGN KEY ("writing_id") REFERENCES "public"."writings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writings" ADD CONSTRAINT "writings_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writings" ADD CONSTRAINT "writings_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writings" ADD CONSTRAINT "writings_type_id_writing_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."writing_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocabulary" ADD CONSTRAINT "vocabulary_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_keywords" ADD CONSTRAINT "article_keywords_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_keywords" ADD CONSTRAINT "article_keywords_keyword_keywords_name_fk" FOREIGN KEY ("keyword") REFERENCES "public"."keywords"("name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "book_keywords" ADD CONSTRAINT "book_keywords_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_keywords" ADD CONSTRAINT "book_keywords_keyword_keywords_name_fk" FOREIGN KEY ("keyword") REFERENCES "public"."keywords"("name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "writing_keywords" ADD CONSTRAINT "writing_keywords_writing_id_writings_id_fk" FOREIGN KEY ("writing_id") REFERENCES "public"."writings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_keywords" ADD CONSTRAINT "writing_keywords_keyword_keywords_name_fk" FOREIGN KEY ("keyword") REFERENCES "public"."keywords"("name") ON DELETE cascade ON UPDATE cascade;