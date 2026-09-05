import { createHash } from "crypto";
import { PRIVATE_MARK } from "@/config/privacy";

/**
 * 私人項目。
 *
 * 目的很窄：在公司打開這個 app 的時候，某些書、文章、書寫不要出現在畫面上。
 * 它不是加密——資料在自己的資料庫裡，拿得到連線字串的人照樣看得到。能擋的是
 * 「同事走過去瞄一眼」，不是拿得到你帳號的人。
 *
 * 但過濾刻意做在伺服器端：鎖著的時候那些列根本不會傳到瀏覽器，比在前端隱藏
 * 好得多——不然按個 F12 或翻一下 localStorage 快取就全看到了。
 *
 * 密碼存資料庫的 settings 表（換裝置才通用，是使用者選的），存的是兩段雜湊：
 *
 *   使用者輸入 → sha256 → 解鎖權杖（存瀏覽器 sessionStorage，也是之後每次請求帶的）
 *              → 再 sha256 → 存進 settings
 *
 * 這樣資料庫裡那一格被看到，也不能直接拿去當權杖用。
 */
const TRUTHY = new Set([PRIVATE_MARK, "y", "yes", "true", "1", "是的", "私人", "v"]);

/** 這一列有沒有自己標私人 */
function markedPrivate(row: PrivateRow): boolean {
  return TRUTHY.has((row.private ?? "").trim().toLowerCase());
}

/** 書寫的類型在 kind，書籍與文章的在 domain／subDomain */
export type PrivateRow = {
  private?: string;
  kind?: string;
  domain?: string;
  subDomain?: string;
};

/** 哪些名字整批算私人。旗標掛在類型自己身上，不是一份要維護的清單 */
export type PrivateOptions = {
  kinds: ReadonlySet<string>; // 書寫的類型
  types: ReadonlySet<string>; // 書籍與文章的領域樹，含被標記者的所有子孫
};

const NO_OPTIONS: PrivateOptions = { kinds: new Set(), types: new Set() };

/**
 * 兩條路都算私人，是「或」不是擇一：
 *
 * - 這一列自己標了私人
 * - 它的領域或類型標了私人（標「政治」，底下的次領域一起藏）
 *
 * 標記掛在領域與類型身上而不回寫個別列：不然會有兩個真實來源，之後取消標記，
 * 那些列還留著「是」。旗標是唯一來源，取消即生效。
 *
 * 關鍵字不帶這個旗標——關鍵字是專有名詞（人名、地名、事件），
 * 「馬克思」本身不是敏感的，敏感的是那本書屬於哪個領域。
 */
export function isPrivate(row: PrivateRow, options: PrivateOptions = NO_OPTIONS): boolean {
  if (markedPrivate(row)) return true;
  if (inList(row.kind, options.kinds)) return true;
  return inList(row.domain, options.types) || inList(row.subDomain, options.types);
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
  // 這個字串是雜湊的鹽，不是識別名——算出來的值存在 settings 表裡。
  // 改名 Archivum 時刻意沒動它：改了就對不上舊雜湊，等於把人鎖在私人項目外面。
  return sha256(`reading-track:${passcode.trim()}`);
}

/** 解鎖權杖 → 存進資料庫的那一份 */
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
 * 這個請求解鎖了沒，以及哪些領域與類型算私人。
 *
 * 清單不管有沒有帶權杖都得讀——鎖著的時候正是要靠它過濾。
 */
export async function requestPrivacy(
  userId: string,
  req: { nextUrl: URL },
): Promise<RequestPrivacy> {
  const { readPrivacySettings } = await import("@/lib/db/queries/settings");
  const { PRIVACY_SETTING_KEY } = await import("@/config/privacy");
  const { stored, privateKinds, privateTypes } = await readPrivacySettings(
    userId,
    PRIVACY_SETTING_KEY,
  );
  const token = req.nextUrl.searchParams.get("unlock");

  return {
    unlocked: isUnlocked(token, stored),
    options: {
      kinds: new Set(privateKinds),
      types: new Set(privateTypes),
    },
  };
}
