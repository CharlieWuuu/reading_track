import { NavGroup } from "./nav";

/**
 * 資料庫裡的類型走哪一條路由。
 *
 * 內建那幾種各自有專屬頁面（書籍有封面牆、關鍵字有維基欄位），沿用舊網址；
 * 自己新增的走通用頁。等舊表搬完，內建的也會一條一條收進通用頁。
 */

/** 通用頁在 /reading/k/<類型編號>。單獨的 /reading/k 不是一條路由，所以不留成常數 */
const SEGMENT = "k";

export const kindHref = (id: string) => `/reading/${SEGMENT}/${id}`;

/** 走在通用頁上時，側欄要亮的是那個類型的編號 */
export function kindIdFromPath(pathname: string): string | null {
  const [, first, second, id] = pathname.split("/");
  return first === "reading" && second === SEGMENT ? (id ?? null) : null;
}

/** 側欄已經寫死的那幾列，用名字對得起來就不重複畫 */
export const isBuiltIn = (group: NavGroup, name: string): boolean =>
  group.types.some((type) => type.label === name);
