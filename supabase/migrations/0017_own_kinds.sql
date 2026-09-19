-- 類型定義不再全站共用：每個帳號複製一份自己的。
--
-- setting_kinds 的 user_id 是 NULL 那幾列是共用目錄，多個帳號指向同一列。
-- 但定義本身（名字、網址、勾哪些模組、模組叫什麼）使用者全都改得掉，本來就是
-- 個人的東西。共用的代價是改它得先 fork，而 fork 漏搬資料就會「內容看得到、
-- 數量是 0」——那個 bug 的根在這裡。
--
-- 這支做三件事：替每個人複製一份、把資料重指過去、刪掉沒人再用的共用列。
-- 順便收拾已經 fork 過但資料留在共用列上的那些。
--
-- 可回復：對照表與被刪的共用列都留成檔案表，反向 SQL 在 docs/rollback-0017.sql。

-- created 分得出「這次新建的」與「他本來就有的」——退回去只能刪前者
CREATE TABLE _kind_fork_map (
	user_id uuid NOT NULL,
	old_id uuid NOT NULL,
	new_id uuid NOT NULL,
	created boolean NOT NULL
);
--> statement-breakpoint

-- 還指著共用列的人，各複製一份。名字或網址已經被自己的類型佔掉的就跳過，
-- 那代表他早就有自己那一份了（下一段會把資料接過去）
WITH ins AS (
	INSERT INTO setting_kinds (user_id, name, slug, group_key, amount_unit, count_unit, inherits_cover, sort_order)
	SELECT uk.user_id, k.name, k.slug, k.group_key, k.amount_unit, k.count_unit, k.inherits_cover, k.sort_order
	FROM setting_user_kinds uk
	JOIN setting_kinds k ON k.id = uk.kind_id
	WHERE k.user_id IS NULL
	  AND NOT EXISTS (
		SELECT 1 FROM setting_kinds mine
		WHERE mine.user_id = uk.user_id AND mine.group_key = k.group_key
		  AND (mine.slug = k.slug OR mine.name = k.name)
	)
	RETURNING id, user_id, group_key, slug
)
INSERT INTO _kind_fork_map (user_id, old_id, new_id, created)
SELECT ins.user_id, k.id, ins.id, true
FROM ins
JOIN setting_kinds k ON k.user_id IS NULL AND k.group_key = ins.group_key AND k.slug = ins.slug;
--> statement-breakpoint

-- 已經有自己那一份、但資料還留在共用列上的（舊版 forkKind 漏搬的那些）。
-- 同 group 且網址或名字對得上，而且只對到一份才接
INSERT INTO _kind_fork_map (user_id, old_id, new_id, created)
SELECT u.id, k.id, mine.id, false
FROM users u
JOIN setting_kinds k ON k.user_id IS NULL
JOIN setting_kinds mine ON mine.user_id = u.id AND mine.group_key = k.group_key
	AND (mine.slug = k.slug OR mine.name = k.name)
WHERE NOT EXISTS (SELECT 1 FROM _kind_fork_map f WHERE f.user_id = u.id AND f.old_id = k.id)
  AND (
	EXISTS (SELECT 1 FROM domain_works d WHERE d.user_id = u.id AND d.kind_id = k.id)
	OR EXISTS (SELECT 1 FROM domain_fragments d WHERE d.user_id = u.id AND d.kind_id = k.id)
	OR EXISTS (SELECT 1 FROM domain_writings d WHERE d.user_id = u.id AND d.kind_id = k.id)
  )
  AND (
	SELECT count(*) FROM setting_kinds m2
	WHERE m2.user_id = u.id AND m2.group_key = k.group_key AND (m2.slug = k.slug OR m2.name = k.name)
  ) = 1;
--> statement-breakpoint

-- 模組對應跟著複製。已經有自己那一份的不動，他的設定才是他要的
INSERT INTO setting_map_kind_field (user_id, kind_id, field_key, field_id, is_visible, sort_order)
SELECT f.user_id, f.new_id, mk.field_key, mk.field_id, mk.is_visible, mk.sort_order
FROM _kind_fork_map f
JOIN setting_map_kind_field mk ON mk.kind_id = f.old_id
WHERE NOT EXISTS (
	SELECT 1 FROM setting_map_kind_field own WHERE own.kind_id = f.new_id
)
ON CONFLICT (kind_id, field_key) DO NOTHING;
--> statement-breakpoint

-- 「我在用」指到自己那一份
UPDATE setting_user_kinds uk SET kind_id = f.new_id
FROM _kind_fork_map f
WHERE uk.user_id = f.user_id AND uk.kind_id = f.old_id
  AND NOT EXISTS (
	SELECT 1 FROM setting_user_kinds dup WHERE dup.user_id = f.user_id AND dup.kind_id = f.new_id
  );
--> statement-breakpoint

DELETE FROM setting_user_kinds uk
USING _kind_fork_map f
WHERE uk.user_id = f.user_id AND uk.kind_id = f.old_id;
--> statement-breakpoint

UPDATE domain_works d SET kind_id = f.new_id
FROM _kind_fork_map f WHERE d.user_id = f.user_id AND d.kind_id = f.old_id;
--> statement-breakpoint

UPDATE domain_fragments d SET kind_id = f.new_id
FROM _kind_fork_map f WHERE d.user_id = f.user_id AND d.kind_id = f.old_id;
--> statement-breakpoint

UPDATE domain_writings d SET kind_id = f.new_id
FROM _kind_fork_map f WHERE d.user_id = f.user_id AND d.kind_id = f.old_id;
--> statement-breakpoint

-- 沒人再指的共用列才刪，而且刪之前整列留一份檔案。
-- 還有人指著的就留著，寧可留垃圾也不要砍到資料
CREATE TABLE _kind_shared_archive AS
SELECT k.* FROM setting_kinds k
WHERE k.user_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM setting_user_kinds uk WHERE uk.kind_id = k.id)
  AND NOT EXISTS (SELECT 1 FROM domain_works d WHERE d.kind_id = k.id)
  AND NOT EXISTS (SELECT 1 FROM domain_fragments d WHERE d.kind_id = k.id)
  AND NOT EXISTS (SELECT 1 FROM domain_writings d WHERE d.kind_id = k.id);
--> statement-breakpoint

CREATE TABLE _kind_shared_field_archive AS
SELECT mk.* FROM setting_map_kind_field mk
WHERE mk.kind_id IN (SELECT id FROM _kind_shared_archive);
--> statement-breakpoint

DELETE FROM setting_map_kind_field mk
WHERE mk.kind_id IN (SELECT id FROM _kind_shared_archive);
--> statement-breakpoint

DELETE FROM setting_kinds k
WHERE k.id IN (SELECT id FROM _kind_shared_archive);
