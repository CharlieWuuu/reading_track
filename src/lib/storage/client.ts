import { createClient } from "@supabase/supabase-js";

/**
 * 圖片存放。私有 bucket，只有伺服器端碰得到。
 *
 * service role 繞過 RLS，所以這個檔案不能被 client component import——
 * 權限一律在 route 那層用 session 判斷，不靠 RLS。
 */
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 沒設");

export const BUCKET = "images";

// session 不落地：每個請求自己帶身分，這支只是拿來簽名與讀寫檔案
const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const storage = supabase.storage.from(BUCKET);
