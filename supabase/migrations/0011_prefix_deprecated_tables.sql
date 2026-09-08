-- 已棄用表前面加底線，Supabase 表格清單排序時排到最前面，方便跟活的表分開看。
-- 沒有程式碼引用這些表名，改名不影響任何查詢。
ALTER TABLE IF EXISTS "quotes_deprecated_20260908" RENAME TO "_quotes_deprecated_20260908";
ALTER TABLE IF EXISTS "vocabulary_deprecated_20260908" RENAME TO "_vocabulary_deprecated_20260908";
ALTER TABLE IF EXISTS "writings_deprecated_20260908" RENAME TO "_writings_deprecated_20260908";
ALTER TABLE IF EXISTS "readings_deprecated_20260908" RENAME TO "_readings_deprecated_20260908";
ALTER TABLE IF EXISTS "articles_deprecated_20260908" RENAME TO "_articles_deprecated_20260908";
ALTER TABLE IF EXISTS "books_deprecated_20260908" RENAME TO "_books_deprecated_20260908";
