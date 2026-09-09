import { KindGroup } from "./record-kinds";
import { NavGroup } from "./nav";

/**
 * 資料庫裡的類型走哪一條路由。
 *
 * 網址統一成 /records|/writings|/fragments/<slug>，內建與自訂類型同一套規則。
 */

export const groupBasePath = (group: KindGroup): string =>
  ({ records: "/records", fragments: "/fragments", writings: "/writings" })[group];

export const kindHref = (group: KindGroup, slug: string): string =>
  `${groupBasePath(group)}/${slug}`;

/** 走在通用頁上時，側欄要亮的是那個類型 */
export function kindGroupSlugFromPath(
  pathname: string,
): { group: KindGroup; slug: string } | null {
  const [, first, second] = pathname.split("/");
  return (first === "records" || first === "fragments" || first === "writings") && second
    ? { group: first, slug: second }
    : null;
}

/** 側欄已經寫死的那幾列，用名字對得起來就不重複畫 */
export const isBuiltIn = (group: NavGroup, name: string): boolean =>
  group.types.some((type) => type.label === name);
