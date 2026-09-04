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
const sql = postgres(url, { prepare: false, max: 1 });

export const db = drizzle(sql);
