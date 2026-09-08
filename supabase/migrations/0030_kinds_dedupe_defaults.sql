-- 六種預設類型（書籍、文章、佳句、單字、關鍵字、書寫）每個使用者各自 seed 了
-- 一份一模一樣的設定，收斂成一列全體共用（user_id = NULL）。
-- 兩人設定完全相同，取 id 較小的那筆當代表，其餘資料改指過去，重複的 kind 刪掉。

ALTER TABLE "map_kind_field" ALTER COLUMN "user_id" DROP NOT NULL;
--> statement-breakpoint

WITH ranked AS (
  SELECT id, name,
    row_number() OVER (PARTITION BY name ORDER BY id) AS rn,
    first_value(id) OVER (PARTITION BY name ORDER BY id) AS keep_id
  FROM "kinds"
  WHERE name IN ('書籍', '文章', '佳句', '單字', '關鍵字', '書寫')
),
dupes AS (
  SELECT id, keep_id FROM ranked WHERE rn > 1
)
UPDATE "works" w SET "kind_id" = d.keep_id FROM dupes d WHERE w."kind_id" = d.id;
--> statement-breakpoint

WITH ranked AS (
  SELECT id, name,
    row_number() OVER (PARTITION BY name ORDER BY id) AS rn,
    first_value(id) OVER (PARTITION BY name ORDER BY id) AS keep_id
  FROM "kinds"
  WHERE name IN ('書籍', '文章', '佳句', '單字', '關鍵字', '書寫')
),
dupes AS (
  SELECT id, keep_id FROM ranked WHERE rn > 1
)
UPDATE "fragments" f SET "kind_id" = d.keep_id FROM dupes d WHERE f."kind_id" = d.id;
--> statement-breakpoint

WITH ranked AS (
  SELECT id, name,
    row_number() OVER (PARTITION BY name ORDER BY id) AS rn,
    first_value(id) OVER (PARTITION BY name ORDER BY id) AS keep_id
  FROM "kinds"
  WHERE name IN ('書籍', '文章', '佳句', '單字', '關鍵字', '書寫')
),
dupes AS (
  SELECT id, keep_id FROM ranked WHERE rn > 1
)
UPDATE "writings" w SET "kind_id" = d.keep_id FROM dupes d WHERE w."kind_id" = d.id;
--> statement-breakpoint

-- map_kind_field 的重複列直接刪掉（兩人設定一樣，代表那筆已經有等價的關聯）
WITH ranked AS (
  SELECT id, name,
    row_number() OVER (PARTITION BY name ORDER BY id) AS rn
  FROM "kinds"
  WHERE name IN ('書籍', '文章', '佳句', '單字', '關鍵字', '書寫')
),
dupes AS (
  SELECT id FROM ranked WHERE rn > 1
)
DELETE FROM "map_kind_field" mkf USING dupes d WHERE mkf."kind_id" = d.id;
--> statement-breakpoint

WITH ranked AS (
  SELECT id, name,
    row_number() OVER (PARTITION BY name ORDER BY id) AS rn
  FROM "kinds"
  WHERE name IN ('書籍', '文章', '佳句', '單字', '關鍵字', '書寫')
),
dupes AS (
  SELECT id FROM ranked WHERE rn > 1
)
DELETE FROM "kinds" k USING dupes d WHERE k.id = d.id;
--> statement-breakpoint

UPDATE "kinds" SET "user_id" = NULL
WHERE name IN ('書籍', '文章', '佳句', '單字', '關鍵字', '書寫');
--> statement-breakpoint

-- 留下來的 map_kind_field 也跟著變共用，不然還綁著某一個使用者的 id
UPDATE "map_kind_field" mkf
SET "user_id" = NULL
FROM "kinds" k
WHERE mkf."kind_id" = k."id" AND k."user_id" IS NULL;
