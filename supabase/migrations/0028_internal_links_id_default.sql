-- internal_links.id 當初漏了 default，從沒被實際 insert 過才沒發現。
ALTER TABLE "internal_links" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
