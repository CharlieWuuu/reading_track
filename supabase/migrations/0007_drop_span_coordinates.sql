-- 一欄塞兩個值的舊欄位退休。資料已搬進 start_year／end_year／latitude／longitude
-- （見 scripts/split-span-coordinates.ts），兩邊筆數對得上才刪。
ALTER TABLE "domain_fragments" DROP COLUMN IF EXISTS "span";
--> statement-breakpoint
ALTER TABLE "domain_fragments" DROP COLUMN IF EXISTS "coordinates";
