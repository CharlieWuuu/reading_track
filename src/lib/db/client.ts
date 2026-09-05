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
 * 連線池大小。
 *
 * 預設的 10 乘上 serverless 的實例數會把 pooler 的額度吃光（症狀是全站
 * 讀取失敗）；但收到 1 又太少——一個實例會同時處理多個請求，而書籍與文章
 * 那兩支各自要發三個查詢，全部擠在同一條連線上排隊，排不完就 30 秒逾時。
 * 兩個極端都試過了，3 是中間值：夠讓一支 route 的三個查詢並行，又不會失控。
 */
const sql = postgres(url, {
  prepare: false,
  max: 3,
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
