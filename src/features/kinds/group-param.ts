import { notFound } from "next/navigation";
import { isKindGroup, KindGroup } from "@/config/record-kinds";

/**
 * 網址第二段那個 group。認不出來就 404——四支頁面都要這一段，各寫一次會漏。
 *
 * 一層路徑的實體資料夾（/stats、/settings…）靜態優先，走不到這裡；
 * 會進來的只有打錯字的網址。
 */
export function groupParam(value: string): KindGroup {
  if (!isKindGroup(value)) notFound();
  return value;
}
