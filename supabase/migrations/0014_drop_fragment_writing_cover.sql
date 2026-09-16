-- 片段與書寫不存自己的封面：78 筆片段只有 1 筆填過，62 則書寫一筆都沒有。
-- 畫面上要顯示的話，封面跟著它連到的那個作品走（catalog 那邊本來就是這樣退而求其次的）。
ALTER TABLE "domain_fragments" DROP COLUMN IF EXISTS "cover_url";
--> statement-breakpoint
ALTER TABLE "domain_writings" DROP COLUMN IF EXISTS "cover_url";
