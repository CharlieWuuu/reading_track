-- 三張表補齊同一組欄位：設定頁勾什麼，資料庫就存得下什麼。
--
-- 模組庫是一套（config/modules.ts），資料表卻是三張，各自只有自己那個 group
-- 當初用得到的欄位。結果是 57 格裡有 33 格勾了不生效，而且不報錯——
-- 書寫 19 個模組只有 3 個真的能用。
--
-- 使用者現在就有 12 個類型在流失資料：勾了「私人」的九個類型一個都沒生效，
-- 佳句與單字的「完成日期」也是。
--
-- 為什麼不真的合成一張表：domain_works／domain_records 那個拆分是有意義的
-- （一本書讀三次＝一個作品三筆紀錄，站內有 5 本重讀過），合掉會毀掉那個模型。
-- 真正的問題是「同一層被拆成三張」，補齊欄位就解決了；形狀一致之後，
-- 模組庫加一個欄位，三個 group 同時都能用。
--
-- 全部 nullable / 有預設值，不動現有資料。

-- 片段缺的：作者、封面、日期、量、私人、語言、外部編號、平台
ALTER TABLE "domain_fragments"
	ADD COLUMN IF NOT EXISTS "creator" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "cover_url" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "start_date" date,
	ADD COLUMN IF NOT EXISTS "end_date" date,
	ADD COLUMN IF NOT EXISTS "amount" integer,
	ADD COLUMN IF NOT EXISTS "is_private" boolean NOT NULL DEFAULT false,
	ADD COLUMN IF NOT EXISTS "language" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "external_id" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "platform" text NOT NULL DEFAULT '';
--> statement-breakpoint

-- 書寫缺的：除了標題、長文、完成日期以外的全部
ALTER TABLE "domain_writings"
	ADD COLUMN IF NOT EXISTS "creator" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "translation" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "locator" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "cover_url" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "start_date" date,
	ADD COLUMN IF NOT EXISTS "amount" integer,
	ADD COLUMN IF NOT EXISTS "is_private" boolean NOT NULL DEFAULT false,
	ADD COLUMN IF NOT EXISTS "pronunciation" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "example" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "example_translation" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "tags" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "start_year" integer,
	ADD COLUMN IF NOT EXISTS "end_year" integer,
	ADD COLUMN IF NOT EXISTS "latitude" double precision,
	ADD COLUMN IF NOT EXISTS "longitude" double precision,
	ADD COLUMN IF NOT EXISTS "language" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "external_id" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "platform" text NOT NULL DEFAULT '';
--> statement-breakpoint

-- 紀錄缺的：片段那邊用的那幾個。掛在 works 而不是 records——
-- 那些是作品的屬性（這個詞怎麼唸、出自哪一頁），不是「這一次讀」的屬性
ALTER TABLE "domain_works"
	ADD COLUMN IF NOT EXISTS "translation" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "locator" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "pronunciation" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "example" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "example_translation" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "tags" text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "start_year" integer,
	ADD COLUMN IF NOT EXISTS "end_year" integer,
	ADD COLUMN IF NOT EXISTS "latitude" double precision,
	ADD COLUMN IF NOT EXISTS "longitude" double precision;
