import { createHash } from "crypto";
import { PRIVATE_MARK } from "@/config/sheet-format";

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

/** 這一列有沒有自己標私人 */
function markedPrivate(row: PrivateRow): boolean {
  return TRUTHY.has((row.private ?? "").trim().toLowerCase());
}

/** 書寫看「類型」，書籍與文章看「屬性」；欄名不同，兩張清單也各自一份 */
export type PrivateRow = { private?: string; kind?: string; type?: string };

/** 哪些選項整批算私人。設定的 key 就用 Sheet 上的欄名，對得起來 */
export type PrivateOptions = {
  kinds: ReadonlySet<string>; // 設定分頁的「私人類型」→ 書寫的類型欄
  types: ReadonlySet<string>; // 設定分頁的「私人屬性」→ 書籍與文章的屬性欄
};

const NO_OPTIONS: PrivateOptions = { kinds: new Set(), types: new Set() };

/**
 * 兩條路都算私人，是「或」不是二選一：
 *
 * - 整個選項設成私人（設定分頁的「私人類型」「私人屬性」），底下每一筆都跟著藏
 * - 這一列自己標了私人，就算它的類型是公開的
 *
 * 設成私人時不回寫個別列的「私人」欄：那樣會有兩個真實來源，之後把它移出清單，
 * 那些列還留著「是」。清單是唯一來源，移出即生效。
 */
export function isPrivate(row: PrivateRow, options: PrivateOptions = NO_OPTIONS): boolean {
  if (markedPrivate(row)) return true;
  return inList(row.kind, options.kinds) || inList(row.type, options.types);
}

function inList(value: string | undefined, list: ReadonlySet<string>): boolean {
  const trimmed = (value ?? "").trim();
  return Boolean(trimmed && list.has(trimmed));
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** 使用者打的密碼 → 瀏覽器拿著的解鎖權杖 */
export function passcodeToToken(passcode: string): string {
  // 這個字串是雜湊的鹽，不是識別名——算出來的值存在使用者的 Sheet 裡。
  // 改名 Archivum 時刻意沒動它：改了就對不上舊雜湊，等於把人鎖在私人項目外面。
  return sha256(`reading-track:${passcode.trim()}`);
}

/** 解鎖權杖 → 存進 Sheet 的那一份 */
export function tokenToStored(token: string): string {
  // 同上：這也是鹽，不能跟著改名走
  return sha256(`reading-track-stored:${token}`);
}

/** 沒設過密碼就沒有私人項目可言，一律當鎖著 */
export function isUnlocked(token: string | null, stored: string): boolean {
  if (!stored || !token) return false;
  return tokenToStored(token) === stored;
}

/** 鎖著就把私人的那幾列整列拿掉；解鎖了就原樣回傳 */
export function withPrivacy<T extends PrivateRow>(
  rows: T[],
  { unlocked, options }: RequestPrivacy,
): T[] {
  return unlocked ? rows : rows.filter((row) => !isPrivate(row, options));
}

export type RequestPrivacy = { unlocked: boolean; options: PrivateOptions };

/**
 * 這個請求解鎖了沒，以及哪些選項整批算私人。
 *
 * 清單不管有沒有帶權杖都得讀——鎖著的時候正是要靠它過濾。所以這裡一定
 * 會多一趟設定分頁；讀密碼與讀清單合成同一趟，至少不是兩趟。
 */
export async function requestPrivacy(
  req: { nextUrl: URL },
  sheetId: string,
  accessToken: string,
): Promise<RequestPrivacy> {
  const { readPrivacySettings } = await import("@/lib/sheets");
  const { stored, privateKinds, privateTypes } = await readPrivacySettings(sheetId, accessToken);
  const token = req.nextUrl.searchParams.get("unlock");

  return {
    unlocked: isUnlocked(token, stored),
    options: { kinds: new Set(privateKinds), types: new Set(privateTypes) },
  };
}
