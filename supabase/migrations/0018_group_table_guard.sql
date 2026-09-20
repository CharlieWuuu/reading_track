-- 三個 group 三張表，寫錯表的最後一道防線。
--
-- 「思緒」（writings）曾經有兩筆寫進 domain_fragments。程式沒擋、資料庫也沒擋，
-- 直到側欄的計數跟清單對不上才被發現——而那兩筆在畫面上根本點不到，
-- 要手動下 SQL 才搬得回去。
--
-- 寫入層已經加了 assertKindGroup，這一層是為了繞過程式碼的情況：
-- 手動下 SQL、匯入腳本、將來某支忘了呼叫 guard 的新 mutation。
--
-- 用觸發器不用 CHECK：CHECK 不能查別張表，而 group 記在 setting_kinds 上。

CREATE OR REPLACE FUNCTION assert_kind_group() RETURNS trigger AS $$
DECLARE
	actual text;
BEGIN
	SELECT group_key INTO actual FROM setting_kinds WHERE id = NEW.kind_id;
	IF actual IS NULL THEN
		RAISE EXCEPTION '找不到類型 %', NEW.kind_id;
	END IF;
	IF actual <> TG_ARGV[0] THEN
		RAISE EXCEPTION '類型 % 屬於 %，不能寫進 % 的表', NEW.kind_id, actual, TG_ARGV[0];
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

DROP TRIGGER IF EXISTS guard_group ON domain_fragments;
--> statement-breakpoint

CREATE TRIGGER guard_group
	BEFORE INSERT OR UPDATE OF kind_id ON domain_fragments
	FOR EACH ROW EXECUTE FUNCTION assert_kind_group('fragments');
--> statement-breakpoint

DROP TRIGGER IF EXISTS guard_group ON domain_writings;
--> statement-breakpoint

CREATE TRIGGER guard_group
	BEFORE INSERT OR UPDATE OF kind_id ON domain_writings
	FOR EACH ROW EXECUTE FUNCTION assert_kind_group('writings');
--> statement-breakpoint

DROP TRIGGER IF EXISTS guard_group ON domain_works;
--> statement-breakpoint

CREATE TRIGGER guard_group
	BEFORE INSERT OR UPDATE OF kind_id ON domain_works
	FOR EACH ROW EXECUTE FUNCTION assert_kind_group('records');
