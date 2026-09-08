-- 心得、日記整併成「書寫」，每個使用者各建一列，套心得那組欄位（多一個 source）。
-- 現有 writings 資料的 kind_id 全部改指過去，舊的心得／日記 kind 連同
-- map_kind_field 一起刪掉（FK cascade）。

WITH new_kind AS (
  INSERT INTO "kinds" ("user_id", "name", "group_key", "amount_unit", "sort_order")
  SELECT DISTINCT k."user_id", '書寫', 'writings', k."amount_unit", 0
  FROM "kinds" k
  WHERE k."name" = '心得'
  RETURNING "id", "user_id"
)
INSERT INTO "map_kind_field" ("user_id", "kind_id", "field_key", "field_id", "is_visible", "sort_order")
SELECT mkf."user_id", nk."id", mkf."field_key", mkf."field_id", mkf."is_visible", mkf."sort_order"
FROM "map_kind_field" mkf
JOIN "kinds" k ON k."id" = mkf."kind_id"
JOIN new_kind nk ON nk."user_id" = mkf."user_id"
WHERE k."name" = '心得';
--> statement-breakpoint

UPDATE "writings" w
SET "kind_id" = nk."id"
FROM "kinds" k
JOIN "kinds" nk ON nk."user_id" = k."user_id" AND nk."name" = '書寫'
WHERE k."id" = w."kind_id" AND k."name" IN ('心得', '日記');
--> statement-breakpoint

DELETE FROM "kinds" WHERE "name" IN ('心得', '日記');
--> statement-breakpoint

-- 旅遊：類型跟底下唯一一筆資料一起刪掉。
DELETE FROM "records" r USING "works" wk, "kinds" k
WHERE r."work_id" = wk."id" AND wk."kind_id" = k."id" AND k."name" = '旅遊';
--> statement-breakpoint
DELETE FROM "works" wk USING "kinds" k
WHERE wk."kind_id" = k."id" AND k."name" = '旅遊';
--> statement-breakpoint
DELETE FROM "kinds" WHERE "name" = '旅遊';
