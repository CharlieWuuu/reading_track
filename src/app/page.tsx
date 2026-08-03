import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ReadingTrack — 用你自己的 Google 試算表記錄閱讀",
  description:
    "ReadingTrack 是個人閱讀紀錄工具，書籍與文章資料存在你自己的 Google 試算表裡。",
};

/**
 * 首頁刻意不擋登入、也不轉址到 /books。
 *
 * Google 的 OAuth 驗證要求首頁能在未登入狀態下說明應用程式用途、
 * 顯示與同意畫面一致的名稱，並提供隱私權政策連結——轉址到登入牆會直接被退件。
 * 已安裝的 PWA 不受影響，manifest 的 start_url 指的是 /books。
 */
export default function Home() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-10">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">ReadingTrack</h1>
        <p className="text-base leading-relaxed text-gray-700">
          記錄你讀過的書與文章，資料存在你自己的 Google
          試算表裡，隨時可以直接打開來看、修改或匯出。
        </p>
        <Link
          href="/books"
          className="inline-block rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          開始使用
        </Link>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-gray-900">這個應用程式做什麼</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-700">
          <li>記錄書籍的書名、作者、出版社、頁數、閱讀起訖日期與筆記</li>
          <li>依書名或購書網址自動補齊書封、作者、頁數等資料</li>
          <li>用月曆與統計圖表回顧每年、每季讀完幾本</li>
          <li>可連接 Instapaper，一併記錄讀過的文章</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-gray-900">為什麼需要存取你的 Google 試算表</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          ReadingTrack 沒有自己的資料庫。你的閱讀紀錄從頭到尾都寫在你指定的那一份 Google
          試算表裡，所以應用程式需要讀取與寫入該檔案的權限。連接方式有兩種：用 Google
          檔案選擇器挑選，或直接貼上試算表網址——後者在手機上尤其重要，因為選擇器的彈出視窗
          在部分行動瀏覽器中無法開啟。
        </p>
        <p className="text-sm leading-relaxed text-gray-700">
          應用程式只會寫入你明確連接的那一份試算表，不會列出、讀取或修改你的其他檔案，
          也不會把你的內容保存在我們的伺服器上。
        </p>
      </section>

      <footer className="border-t pt-4 text-sm">
        <Link href="/privacy" className="underline">
          隱私權政策
        </Link>
        <span className="mx-2 text-gray-300">·</span>
        <span className="text-gray-500">聯絡：charliewu500@gmail.com</span>
      </footer>
    </div>
  );
}
