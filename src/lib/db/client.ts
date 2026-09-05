import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/**
 * 資料庫連線。
 *
 * serverless 上每個請求都可能是新的實例，連線要走 pooler（連線字串裡有 pooler 那條），
 * 不然連線數很快就滿。prepare 關掉也是為了 pooler：交易模式的 pooler 不保證同一條連線，
 * prepared statement 會找不到。
 *
 * 模組層只建一次，同一個實例裡的請求共用。
 */
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL 沒設");

/**
 * 一個實例只要一條連線。postgres.js 預設開 10，乘上 serverless 的實例數就把
 * pooler 的額度吃光了——症狀是全站「讀取失敗」，錯誤訊息在伺服器端才看得到。
 */
const sql = postgres(url, {
  prepare: false,
  max: 1,
  // serverless 上實例來來去去，連線不主動還就會一直累積，最後把 pooler 的名額
  // 佔滿——症狀是每一支 API 都卡到 30 秒逾時（504），而不是明確的錯誤
  idle_timeout: 20,
  max_lifetime: 60 * 5,
  // 連不上就快點失敗，不要拖到函式逾時；那時使用者只會看到一片空白
  connect_timeout: 10,
});

export const db = drizzle(sql);

/**
 * 交易裡面要用的那個 handle。
 *
 * 交易的每一句都必須走它——用外層的 db 等於在交易外面另開一條連線，
 * 那些語句不會被回滾，而且 max: 1 的時候會直接死鎖（交易佔著唯一那條，
 * 外層的查詢排隊等它，它又在等查詢）。
 */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
