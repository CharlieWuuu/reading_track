import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChartPie, Sparkles, Table2 } from "lucide-react";

export const metadata: Metadata = {
  title: "ReadingTrack — 用你自己的 Google 試算表記錄閱讀",
  description: "ReadingTrack 是個人閱讀紀錄工具，書籍與文章資料存在你自己的 Google 試算表裡。",
};

/** 示意用的假書單。用真的欄位排出真的樣子，比截圖好維護，也不會有解析度問題 */
const SAMPLE = [
  { title: "臺灣漫遊錄", author: "楊双子", tags: ["歷史", "小說"], done: "2026-05-24" },
  { title: "深度工作力", author: "卡爾．紐波特", tags: ["效率", "論述"], done: "2024-04-01" },
  { title: "廚房", author: "吉本芭娜娜", tags: ["文學", "小說"], done: null },
];

/** 與 lib/tagColors 同一組色相順序 */
const TAG_STYLES: Record<string, string> = {
  歷史: "bg-amber-50 text-amber-800",
  小說: "bg-blue-50 text-blue-800",
  效率: "bg-cyan-50 text-cyan-800",
  論述: "bg-violet-50 text-violet-800",
  文學: "bg-rose-50 text-rose-800",
};

const FEATURES = [
  {
    Icon: Sparkles,
    title: "貼上網址就自動補齊",
    body: "書名或購書連結丟進去，書封、作者、出版社、頁數與字數自動查回來。",
  },
  {
    Icon: Table2,
    title: "自己的分類方式",
    body: "領域、屬性、平台的選項都能自訂，屬性還可以複選，不用遷就別人的分類法。",
  },
  {
    Icon: ChartPie,
    title: "看得到累積",
    body: "每季讀完幾本、領域分布、常讀的作者與出版社、重讀最多的書。",
  },
  {
    Icon: CalendarDays,
    title: "月曆回顧",
    body: "哪一天讀完哪一本、那個月讀了哪些文章，一眼看完。",
  },
];

/**
 * 首頁刻意不擋登入、也不轉址到 /books。
 *
 * Google 的 OAuth 驗證要求首頁能在未登入狀態下說明應用程式用途、
 * 顯示與同意畫面一致的名稱，並提供隱私權政策連結——轉址到登入牆會直接被退件。
 * 已安裝的 PWA 不受影響，manifest 的 start_url 指的是 /books。
 */
export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 py-10">
      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">ReadingTrack</h1>
        <p className="text-base leading-relaxed text-gray-700 sm:text-lg">
          記錄你讀過的書與文章。資料存在你自己的 Google 試算表裡，隨時可以直接打開來看、修改或匯出。
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/books"
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            開始使用
          </Link>
          <span className="text-xs text-gray-500">用 Google 帳號登入，不需另外註冊</span>
        </div>
      </header>

      {/* 產品示意：用假資料排出書單的實際樣子，讓人先看到它長什麼樣 */}
      <section aria-label="介面示意" className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-xl border border-gray-900 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-900 px-4 py-2.5">
            <span className="text-sm font-semibold">書籍紀錄</span>
            <span className="rounded bg-gray-900 px-2.5 py-1 text-xs font-medium text-white">
              新增書籍
            </span>
          </div>
          <ul className="divide-y">
            {SAMPLE.map((book, i) => (
              <li key={book.title} className="flex items-center gap-3 px-4 py-3">
                <div className="flex aspect-2/3 w-8 shrink-0 items-center justify-center rounded-sm bg-gray-100 text-[10px] leading-tight text-gray-400">
                  {book.title.slice(0, 2)}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-xs text-gray-400 tabular-nums">#{SAMPLE.length - i}</span>
                    <span className="truncate">{book.title}</span>
                  </p>
                  <p className="truncate text-xs text-gray-500">{book.author}</p>
                </div>
                <div className="hidden items-center gap-1.5 sm:flex">
                  {book.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex h-5 items-center rounded px-1.5 text-[11px] font-medium ${TAG_STYLES[tag]}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="w-20 shrink-0 text-right text-xs text-gray-400">
                  {book.done ? `${book.done} 讀完` : "閱讀中"}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-center text-xs text-gray-400">這是介面示意，書目為範例資料</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-gray-900">這個應用程式做什麼</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} className="flex flex-col gap-2 rounded-lg border bg-white p-4">
              <Icon size={18} strokeWidth={1.5} className="text-gray-500" />
              <p className="text-sm font-medium">{title}</p>
              <p className="text-sm leading-relaxed text-gray-600">{body}</p>
            </div>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-gray-600">
          也可以連接 Instapaper，把讀過的文章一併記錄進來。
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-dashed p-5">
        <h2 className="text-sm font-medium text-gray-900">為什麼需要存取你的 Google 試算表</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          ReadingTrack 沒有自己的資料庫。你的閱讀紀錄從頭到尾都寫在你指定的那一份 Google
          試算表裡，所以應用程式需要讀取與寫入該檔案的權限。你用 Google
          檔案選擇器挑選要連接的試算表，授權範圍僅限那一份檔案。
        </p>
        <p className="text-sm leading-relaxed text-gray-700">
          應用程式只能存取你親手挑選的那一份試算表，看不到你雲端硬碟裡的其他檔案，
          也不會把你的內容保存在我們的伺服器上。
        </p>
      </section>

      <footer className="flex flex-wrap items-center gap-2 border-t pt-4 text-sm">
        <Link href="/privacy" className="underline">
          隱私權政策
        </Link>
        <span className="text-gray-300">·</span>
        <span className="text-gray-500">聯絡：charliewu500@gmail.com</span>
      </footer>
    </div>
  );
}
