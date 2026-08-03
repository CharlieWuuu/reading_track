import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隱私權政策｜ReadingTrack",
  description: "ReadingTrack 如何處理你的資料",
};

/**
 * Google OAuth 驗證與 Play 上架都要求一個公開可讀的隱私權政策網址，
 * 所以這頁刻意不放在登入牆後面。
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8 text-sm leading-relaxed text-gray-700">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">隱私權政策</h1>
        <p className="mt-1 text-xs text-gray-500">最後更新：2026 年 7 月 30 日</p>
      </div>

      <section className="space-y-2">
        <h2 className="font-medium text-gray-900">我們存取哪些資料</h2>
        <p>
          ReadingTrack 使用 Google 帳號登入，並在你透過 Google 檔案選擇器挑選後，
          僅存取你指定的那一份 Google 試算表，用來讀取與寫入你的書籍與文章紀錄。我們會取得你的姓名、電子郵件與大頭貼，
          僅用於顯示登入狀態。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium text-gray-900">資料存放在哪裡</h2>
        <p>
          你的閱讀紀錄全部存放在你自己的 Google
          試算表裡，本服務不另外建立資料庫、不保存你的書籍內容。登入所需的存取權杖只保存在你瀏覽器的
          加密 cookie 中，用來代表你向 Google 發出請求。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium text-gray-900">我們不做的事</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>不將你的資料提供、販售或分享給第三方</li>
          <li>不用你的資料投放廣告或訓練模型</li>
          <li>不存取你授權範圍以外的其他 Google 雲端硬碟檔案</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium text-gray-900">補齊書籍資料時的對外查詢</h2>
        <p>
          使用「補齊資料」或「重新抓取」時，會把書名或你提供的網址送到 Google Books
          等公開書目來源查詢，除此之外不會送出你的個人資料。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium text-gray-900">如何刪除資料</h2>
        <p>
          在「個人資訊」頁登出即可清除本服務保存的登入狀態。若要完全解除授權，請到{" "}
          <a
            className="underline"
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google 帳號的第三方應用程式頁面
          </a>
          移除 ReadingTrack。你的閱讀紀錄在你自己的試算表中，刪除該試算表即可刪除全部內容。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium text-gray-900">聯絡方式</h2>
        <p>有任何疑問請來信 charliewu500@gmail.com。</p>
      </section>

      <Link href="/books" className="inline-block text-xs text-gray-500 underline">
        回到書籍列表
      </Link>
    </div>
  );
}
