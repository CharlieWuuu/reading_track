ALTER TABLE "metrics" DROP CONSTRAINT "metrics_writing_id_writings_id_fk";
--> statement-breakpoint
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_writing_id_fragments_id_fk" FOREIGN KEY ("writing_id") REFERENCES "public"."fragments"("id") ON DELETE cascade ON UPDATE no action;