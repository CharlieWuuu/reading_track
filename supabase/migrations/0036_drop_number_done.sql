-- 完成的依序編號不再是選項：有完成日期的類型，表格一律編號。

ALTER TABLE "setting_kinds" DROP COLUMN IF EXISTS "number_done";
