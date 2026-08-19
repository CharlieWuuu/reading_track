import { createHash } from "crypto";
import { PRIVACY_SETTING_KEY, PRIVATE_MARK } from "@/config/sheet-format";

/**
 * 私人項目。
 *
 * 目的很窄：在公司打開這個 app 的時候，某些書、文章、書寫不要出現在畫面上。
 * 它不是加密——資料就在你自己的 Google Sheet 上，打開試算表就看得到。能擋的是
 * 「同事走過去瞄一眼」，不是拿得到你帳號的人。
 *
 * 但過濾刻意做在伺服器端：鎖著的時候那些列根本不會傳到瀏覽器，比在前端隱藏
 * 好得多——不然按個 F12 或翻一下 localStorage 快取就全看到了。
 *
 * 密碼存 Sheet 的「設定」分頁（換裝置才通用，是使用者選的），存的是兩段雜湊：
 *
 *   使用者輸入 → sha256 → 解鎖權杖（存瀏覽器 sessionStorage，也是之後每次請求帶的）
 *              → 再 sha256 → 存進 Sheet
 *
 * 這樣 Sheet 上那一格被看到，也不能直接拿去當權杖用。
 */
const TRUTHY = new Set([PRIVATE_MARK, "y", "yes", "true", "1", "是的", "私人", "v"]);

export function isPrivate(row: { private?: string }): boolean {
  return TRUTHY.has((row.private ?? "").trim().toLowerCase());
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** 使用者打的密碼 → 瀏覽器拿著的解鎖權杖 */
export function passcodeToToken(passcode: string): string {
  return sha256(`reading-track:${passcode.trim()}`);
}

/** 解鎖權杖 → 存進 Sheet 的那一份 */
export function tokenToStored(token: string): string {
  return sha256(`reading-track-stored:${token}`);
}

/** 沒設過密碼就沒有私人項目可言，一律當鎖著 */
export function isUnlocked(token: string | null, stored: string): boolean {
  if (!stored || !token) return false;
  return tokenToStored(token) === stored;
}

/** 鎖著就把私人的那幾列整列拿掉；解鎖了就原樣回傳 */
export function withPrivacy<T extends { private?: string }>(rows: T[], unlocked: boolean): T[] {
  return unlocked ? rows : rows.filter((row) => !isPrivate(row));
}

/**
 * 這個請求解鎖了沒。沒帶權杖就不用去讀設定，省一次 Sheet 往返。
 */
export async function requestUnlocked(
  req: { nextUrl: URL },
  sheetId: string,
  accessToken: string,
): Promise<boolean> {
  const token = req.nextUrl.searchParams.get("unlock");
  if (!token) return false;
  const { readSetting } = await import("@/lib/sheets");
  const stored = await readSetting(sheetId, accessToken, PRIVACY_SETTING_KEY);
  return isUnlocked(token, stored);
}
