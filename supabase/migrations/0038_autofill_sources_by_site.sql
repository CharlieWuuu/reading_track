-- 補齊來源細到各家網站：原本的 books 拆成六家，使用者可以自己挑。
--
-- 順序照 config/autofill-sources：給得出頁數與字數的書店在前。

UPDATE "setting_kinds"
SET "autofill_sources" = 'taaze,pubu,readmoo,ndl,google-books,open-library'
WHERE "autofill_sources" = 'books';
