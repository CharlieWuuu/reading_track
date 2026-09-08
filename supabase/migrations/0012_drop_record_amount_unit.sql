-- 單位不再讓每筆紀錄自己覆蓋，完全跟著類型（record_kinds.amount_unit）走。
ALTER TABLE "records" DROP COLUMN "amount_unit";
