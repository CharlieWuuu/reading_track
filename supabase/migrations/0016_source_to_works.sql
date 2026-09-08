-- source（出版社/頻道/平台）、external_id（ISBN）、cover_url 搬到 works：
-- 同一本書不管讀幾次，這三個都固定，不是「這一次讀」的屬性。
ALTER TABLE "works" ADD COLUMN "source" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "external_id" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "cover_url" text DEFAULT '' NOT NULL;
--> statement-breakpoint
-- 每個作品可能有多筆紀錄各自帶著值（理論上該一樣），取最早那筆非空值當作品的值
UPDATE "works" AS w
SET
  "source" = r."source",
  "external_id" = r."external_id",
  "cover_url" = r."cover_url"
FROM (
  SELECT DISTINCT ON ("work_id") "work_id", "source", "external_id", "cover_url"
  FROM "records"
  ORDER BY "work_id", "created_at" ASC
) AS r
WHERE r."work_id" = w."id";
--> statement-breakpoint
ALTER TABLE "records" DROP COLUMN "source";
--> statement-breakpoint
ALTER TABLE "records" DROP COLUMN "external_id";
--> statement-breakpoint
ALTER TABLE "records" DROP COLUMN "cover_url";
