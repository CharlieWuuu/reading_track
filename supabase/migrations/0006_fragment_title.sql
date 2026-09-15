-- name 與 phrase 是同一件事：這一筆的標題。單字存 name、佳句存 phrase，
-- 兩者從來沒有同時有值（134 筆裡 113 + 21 + 0 重疊），只是被拆成兩個名字，
-- 連讀取端都得寫一支 fragmentLabel 去挑該用哪個。
--
-- 併成 title，跟 works.title 同一個字——模組層本來就一律叫 title。
ALTER TABLE "domain_fragments" RENAME COLUMN "name" TO "title";--> statement-breakpoint
UPDATE "domain_fragments" SET "title" = "phrase" WHERE "title" = '' AND "phrase" <> '';--> statement-breakpoint
ALTER TABLE "domain_fragments" DROP COLUMN "phrase";
--> statement-breakpoint
-- 書寫那張表也一樣：標題欄叫 name，跟 works.title、fragments.title 對不起來
ALTER TABLE "domain_writings" RENAME COLUMN "name" TO "title";
