-- kinds.user_id 放寬成可空：NULL 代表系統預設，不是哪個使用者自己建的。
-- 現有資料不動，這批只是鬆開限制，真的把預設值收斂成 NULL 是之後的事。
ALTER TABLE "kinds" ALTER COLUMN "user_id" DROP NOT NULL;
--> statement-breakpoint

-- fields 表當初拆掉 user_id 變全體共用，現在加回來（可空）：
-- NULL 代表系統預設名稱，非 NULL 代表哪個使用者自己打的字——不是走回頭路，
-- 是讓「預設」跟「使用者自訂」在同一張表裡分得出來。
ALTER TABLE "fields" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
ALTER TABLE "fields" ADD CONSTRAINT "fields_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
