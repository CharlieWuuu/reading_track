-- 六張已經沒有任何程式讀寫的舊表：books/readings/articles 搬進 works+records，
-- quotes/vocabulary 搬進 fragments，writings 搬進 fragments（metrics 也已經指向 fragments）。
-- writing_types／keywords／book_types／attributes 還在用，不動。
--
-- 先改名不真的刪：掛個 _deprecated_20260908 尾巴，資料還在、只是路徑上看不到、
-- 也不會被誤認成活的表。點過一輪確認没事，再另外寫一支 migration 真的 drop。
ALTER TABLE IF EXISTS "quotes" RENAME TO "quotes_deprecated_20260908";
ALTER TABLE IF EXISTS "vocabulary" RENAME TO "vocabulary_deprecated_20260908";
ALTER TABLE IF EXISTS "writings" RENAME TO "writings_deprecated_20260908";
ALTER TABLE IF EXISTS "readings" RENAME TO "readings_deprecated_20260908";
ALTER TABLE IF EXISTS "articles" RENAME TO "articles_deprecated_20260908";
ALTER TABLE IF EXISTS "books" RENAME TO "books_deprecated_20260908";
