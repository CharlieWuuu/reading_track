import * as cheerio from "cheerio";

/** 把整頁純文字壓成單行，方便用「頁數：352頁」這種標籤取值 */
export function flatText($: cheerio.CheerioAPI): string {
  return $("body").text().replace(/\s+/g, " ");
}

/** 取出 "標籤：值" 形式的欄位，值到下一個全形冒號欄位為止 */
export function labelValue(text: string, label: string, maxLen = 40): string {
  const re = new RegExp(`${label}\\s*[:：]\\s*([^:：]{1,${maxLen}})`);
  const match = text.match(re);
  if (!match) return "";
  // 下一個標籤會黏在值後面（例："繁體中文裝訂方式"），切掉尾巴的標籤字樣
  return match[1].replace(/\s*[一-龥A-Za-z]{2,6}$/, "").trim() || match[1].trim();
}

export function digitsOnly(value: string): string {
  const match = value.replace(/,/g, "").match(/\d+/);
  return match ? match[0] : "";
}
