-- domain_work_attributes 改名 domain_attribute：跟其他表一樣照領域分前綴，
-- 不用 work_ 這個多餘的中綴。

ALTER TABLE "domain_work_attributes" RENAME TO "domain_attribute";
