-- amount（頁數／分鐘／集數）從 domain_records 搬到 domain_works。
--
-- 份量是作品的屬性，不是某一次讀的屬性——跟出版社、封面同一個道理。掛在紀錄上
-- 反而讓「重讀」這件事變得詭異：同一本書分兩次記，難道要問使用者這次讀的是
-- 紙本還是電子書、頁數字數要不要跟上次不一樣。搬過去，一本書只有一組份量。
--
-- 一個作品可能有多筆紀錄（重讀），backfill 用「最早那筆紀錄的 amount」代表整本書；
-- 那筆是空的才退而求其次拿其他任一筆有值的。

ALTER TABLE "domain_works" ADD COLUMN "amount" integer;
--> statement-breakpoint

WITH ranked AS (
  SELECT
    work_id,
    amount,
    row_number() OVER (PARTITION BY work_id ORDER BY created_at ASC) AS rn
  FROM "domain_records"
  WHERE amount IS NOT NULL
)
UPDATE "domain_works" w
SET amount = ranked.amount
FROM ranked
WHERE ranked.work_id = w.id AND ranked.rn = 1;
--> statement-breakpoint

ALTER TABLE "domain_records" DROP COLUMN "amount";
