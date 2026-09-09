-- domain_topics 改名 domain_record_topic：跟書寫的主題樹分開，不要共用一張表
-- 混淆彼此是誰的分類。書/文章沿用這份既有資料，不動。
ALTER TABLE "domain_topics" RENAME TO "domain_record_topic";
--> statement-breakpoint

-- 書寫的主題樹是全新、獨立的一份，跟 domain_record_topic 結構一樣但資料互不相干。
CREATE TABLE "domain_writing_topic" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parent_id" uuid REFERENCES "domain_writing_topic"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "is_private" boolean NOT NULL DEFAULT false
);
--> statement-breakpoint

-- 書寫可以掛一個主題節點，跟 domain_works.topic_id 是同樣的用法但指向不同的樹。
ALTER TABLE "domain_writings" ADD COLUMN "topic_id" uuid
  REFERENCES "domain_writing_topic"("id") ON DELETE SET NULL;
