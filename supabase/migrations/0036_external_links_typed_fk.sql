-- links_external 從 source_type/source_id（應用層判斷該去哪張表）
-- 改成 record_id/fragment_id/writing_id 三個真正的外鍵，各自可空，
-- CHECK 頂住剛好一個非空。
--
-- 書寫過去借用 source_type='fragment'，sourceId 其實是 domain_writings.id
-- 不是 domain_fragments.id（兩張表是不同的 id 空間）——這批連結要導去新的
-- writing_id，不能跟真正的 fragment 連結一起塞進 fragment_id。

ALTER TABLE "links_external" ADD COLUMN "record_id" uuid REFERENCES "domain_records"("id") ON DELETE CASCADE;
--> statement-breakpoint

ALTER TABLE "links_external" ADD COLUMN "fragment_id" uuid REFERENCES "domain_fragments"("id") ON DELETE CASCADE;
--> statement-breakpoint

ALTER TABLE "links_external" ADD COLUMN "writing_id" uuid REFERENCES "domain_writings"("id") ON DELETE CASCADE;
--> statement-breakpoint

UPDATE "links_external" SET "record_id" = "source_id" WHERE "source_type" = 'record';
--> statement-breakpoint

-- 借用 fragment 的那些，先試著導去真正的 fragment_id；
-- 對不到（其實是 writing）的下一步再導去 writing_id
UPDATE "links_external" le SET "fragment_id" = le."source_id"
WHERE le."source_type" = 'fragment'
  AND EXISTS (SELECT 1 FROM "domain_fragments" f WHERE f."id" = le."source_id");
--> statement-breakpoint

UPDATE "links_external" le SET "writing_id" = le."source_id"
WHERE le."source_type" = 'fragment'
  AND le."fragment_id" IS NULL
  AND EXISTS (SELECT 1 FROM "domain_writings" w WHERE w."id" = le."source_id");
--> statement-breakpoint

-- 兩邊都對不到的孤兒列（來源已經被刪但連結沒清乾淨）直接丟棄，不留垃圾資料
DELETE FROM "links_external"
WHERE "record_id" IS NULL AND "fragment_id" IS NULL AND "writing_id" IS NULL;
--> statement-breakpoint

ALTER TABLE "links_external" DROP COLUMN "source_type";
--> statement-breakpoint

ALTER TABLE "links_external" DROP COLUMN "source_id";
--> statement-breakpoint

ALTER TABLE "links_external" ADD CONSTRAINT "links_external_exactly_one_source"
  CHECK ((
    ("record_id" IS NOT NULL)::int +
    ("fragment_id" IS NOT NULL)::int +
    ("writing_id" IS NOT NULL)::int
  ) = 1);
