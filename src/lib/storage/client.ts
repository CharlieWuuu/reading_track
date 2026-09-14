import { createClient } from "@supabase/supabase-js";

/**
 * 圖片存放。私有 bucket，只有伺服器端碰得到。
 *
 * service role 繞過 RLS，所以這個檔案不能被 client component import——
 * 權限一律在 route 那層用 session 判斷，不靠 RLS。
 *
 * 用到才建，不在模組層檢查環境變數：轉存那支掛在共用的寫入路徑上，
 * 模組層 throw 會讓整個寫入 API 在載入時就死——圖片沒設定不該拖垮記一筆書。
 */

export const BUCKET = "images";

let cached: ReturnType<typeof createClient> | null = null;

/** 沒設環境變數就回 null，呼叫端自己決定要略過還是回錯 */
function client() {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  // session 不落地：每個請求自己帶身分，這支只是拿來簽名與讀寫檔案
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export const storage = () => client()?.storage.from(BUCKET) ?? null;
