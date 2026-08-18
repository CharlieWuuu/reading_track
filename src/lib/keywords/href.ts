/** 關鍵字沒有編號，網址上就用名字本身；名字可能有斜線與空白，一律編碼 */
export function keywordEditHref(name: string): string {
  return `/keywords/${encodeURIComponent(name)}/edit`;
}
