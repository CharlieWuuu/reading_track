ALTER TABLE "article_keywords" DROP CONSTRAINT "article_keywords_article_id_articles_id_fk";
--> statement-breakpoint
ALTER TABLE "book_keywords" DROP CONSTRAINT "book_keywords_book_id_books_id_fk";
--> statement-breakpoint
ALTER TABLE "writing_keywords" DROP CONSTRAINT "writing_keywords_writing_id_writings_id_fk";
--> statement-breakpoint
ALTER TABLE "article_keywords" ADD CONSTRAINT "article_keywords_article_id_works_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_keywords" ADD CONSTRAINT "book_keywords_book_id_works_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_keywords" ADD CONSTRAINT "writing_keywords_writing_id_fragments_id_fk" FOREIGN KEY ("writing_id") REFERENCES "public"."fragments"("id") ON DELETE cascade ON UPDATE no action;