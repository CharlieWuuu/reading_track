-- 三件名字對不上實際內容的事。
--
-- 1. source 裝的一直是「在哪讀的」（實體書、Kobo、HyRead、Medium），不是出版社。
--    出版社是舊表 COALESCE(platform, publisher) 壓成一欄時混進來的，現在不存了。
--    既有的 platform 欄幾乎全空，先把僅有的那筆併回 source 再讓路。
UPDATE "domain_works" SET "source" = "platform" WHERE "platform" <> '' AND "source" <> "platform";
--> statement-breakpoint
ALTER TABLE "domain_works" DROP COLUMN IF EXISTS "platform";
--> statement-breakpoint
UPDATE "domain_works" SET "source" = 'HyRead' WHERE "source" = 'Hyread'; -- 大小寫兩種寫法併成一種
--> statement-breakpoint
ALTER TABLE "domain_works" RENAME COLUMN "source" TO "platform";
--> statement-breakpoint
-- 2. 書寫的 date 是「這篇完成在哪天」，跟紀錄的 end_date 同一個概念。
ALTER TABLE "domain_writings" RENAME COLUMN "date" TO "end_date";
--> statement-breakpoint
-- 3. 片段沒有日期：抄下一句話沒有起訖。170 筆只有 1 筆填過，且與 created_at 同一天。
ALTER TABLE "domain_fragments" DROP COLUMN IF EXISTS "date";
