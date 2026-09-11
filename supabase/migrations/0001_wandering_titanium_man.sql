ALTER TABLE "domain_fragments" DROP CONSTRAINT "domain_fragments_work_id_domain_works_id_fk";
--> statement-breakpoint
ALTER TABLE "domain_fragments" DROP COLUMN "work_id";