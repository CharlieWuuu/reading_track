/**
 * demo 站的旗標。正式站兩個都不設，行為完全不變。
 *
 * DEMO_EMAIL（伺服器）：沒登入的訪客一律當成這個帳號，讀寫都算數。
 * 髒掉的資料靠每天的重置洗掉（/api/demo/reset）。
 */
export const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "";
