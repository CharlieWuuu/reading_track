-- 舊的 work_id 備份欄退休。關聯已全數搬進 links_internal，
-- 備份欄每一筆都在那裡找得到對應的連結（prod 28/28、32/32）才刪。
ALTER TABLE "domain_fragments" DROP COLUMN IF EXISTS "_work_id_deprecated_20260915";
--> statement-breakpoint
ALTER TABLE "domain_writings" DROP COLUMN IF EXISTS "_work_id_deprecated_20260915";
