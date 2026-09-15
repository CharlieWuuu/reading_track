-- 書寫的主題那層退休：那套分類後來整個變成 kind（思緒、工作、隨筆現在都是類型），
-- 兩邊名字還重疊著。71 筆書寫沒有一筆指過 topic_id，表裡 7 筆全是孤兒。
ALTER TABLE "domain_writings" DROP COLUMN IF EXISTS "topic_id";
--> statement-breakpoint
DROP TABLE IF EXISTS "domain_writing_topic";
