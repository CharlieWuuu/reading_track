-- 片段（佳句、單字、關鍵字）與書寫也能有封面圖——跟書籍、文章一樣，
-- 部落格式的封面不是作品獨有的東西，跟 domain_works.cover_url 同一種欄位定義。

ALTER TABLE "domain_fragments" ADD COLUMN "cover_url" text NOT NULL DEFAULT '';
--> statement-breakpoint

ALTER TABLE "domain_writings" ADD COLUMN "cover_url" text NOT NULL DEFAULT '';
