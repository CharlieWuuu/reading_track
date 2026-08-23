import { Book } from "@/types/book";

/**
 * 查一本書的基本資料。兩種入口都在這裡：貼網址、或打書名。
 *
 * 新增書籍有兩個畫面會用到（先查再填的 BookLookupStep、表單裡的「重新抓取」），
 * 原本兩支各寫一份一模一樣的 fetch。
 *
 * 查不到一律回 null，不丟例外——「沒查到」是預期中的結果，不是錯誤。
 */
export async function scrapeBook(url: string): Promise<Partial<Book> | null> {
  const res = await fetch("/api/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  // 連書名都沒抓到就當作沒查到：其餘欄位單獨存在沒有意義
  return data?.title ? data : null;
}

export async function searchBookByTitle(title: string): Promise<Partial<Book> | null> {
  const res = await fetch(`/api/search-book?q=${encodeURIComponent(title)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0] ?? null;
}
