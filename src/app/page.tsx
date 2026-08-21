import type { Metadata } from "next";
import Link from "next/link";
import { PageBody } from "@/components/layout/page-body";

export const metadata: Metadata = {
  title: "Archivum — 用你自己的 Google 試算表記錄閱讀",
  description: "Archivum 是個人閱讀紀錄工具，書籍與文章資料存在你自己的 Google 試算表裡。",
};

const STEPS = [
  {
    title: "連接一份 Google 試算表",
    body: "用 Google 檔案選擇器挑一份試算表，紀錄就寫在那份檔案裡。",
  },
  {
    title: "新增書籍",
    body: "輸入書名或貼上購書連結，例如「被討厭的勇氣」，書封、作者、出版社、頁數會自動查回來。",
  },
  {
    title: "記下讀完的日期與心得",
    body: "起訖日期、心得、佳句、單字都能一起記；統計只算已經讀完的項目。",
  },
];

const FEATURES = [
  "領域、屬性、平台的分類選項都可以自訂，屬性能複選。",
  "統計看得到每季讀完幾本、領域分布、常讀的作者與出版社。",
  "月曆可以回顧哪一天讀完哪一本書、那個月讀了哪些文章。",
  "文章跟書籍記在同一頁，可以切表格或卡片兩種排列。",
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
    <PageBody>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 py-10">
        <header className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Archivum</h1>
          <p className="text-base leading-relaxed text-gray-700 sm:text-lg">
            記錄你讀過的書與文章。資料存在你自己的 Google
            試算表裡，隨時可以直接打開來看、修改或匯出。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/reading/books"
              className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              開始使用
            </Link>
            <span className="text-xs text-gray-500">用 Google 帳號登入，不需另外註冊</span>
          </div>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-gray-900">怎麼用</h2>
          <ol className="flex flex-col gap-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3 rounded-lg border bg-white p-4">
                <span className="text-sm font-medium text-gray-400 tabular-nums">{i + 1}</span>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-sm leading-relaxed text-gray-600">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-gray-900">還可以做什麼</h2>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            {FEATURES.map((text) => (
              <li key={text} className="text-sm leading-relaxed text-gray-600">
                {text}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-dashed p-5">
          <h2 className="text-sm font-medium text-gray-900">為什麼需要存取你的 Google 試算表</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            Archivum 沒有自己的資料庫。你的閱讀紀錄從頭到尾都寫在你指定的那一份 Google
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
    </PageBody>
  );
}
