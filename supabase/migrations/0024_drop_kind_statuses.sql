-- 狀態改用 start_date／end_date 純推論（想讀／閱讀中／已讀完三態固定），
-- 不再讓每個類型自訂說法。records.status_id 跟 kind_statuses 整張表都拔掉。
ALTER TABLE "records" DROP CONSTRAINT "records_status_id_record_kind_statuses_id_fk";
--> statement-breakpoint
ALTER TABLE "records" DROP COLUMN "status_id";
--> statement-breakpoint
DROP TABLE "kind_statuses";
