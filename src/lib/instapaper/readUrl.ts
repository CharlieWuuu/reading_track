/** Instapaper 站上該篇文章的閱讀頁；沒有 bookmark_id 時退回原文網址 */
export function instapaperReadUrl(bookmarkId: number | string, fallbackUrl = ""): string {
  return bookmarkId
    ? `https://www.instapaper.com/read/${bookmarkId}`
    : fallbackUrl;
}
