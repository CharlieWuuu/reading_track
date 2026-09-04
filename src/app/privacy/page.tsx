import type { Metadata } from "next";
import Link from "next/link";
import { PageBody } from "@/components/layout/page-body";

export const metadata: Metadata = {
  title: "隱私權政策｜Archivum",
  description: "Archivum 如何處理你的資料",
};

/**
 * Google OAuth 驗證與 Play 上架都要求一個公開可讀的隱私權政策網址，
 * 所以這頁刻意不放在登入牆後面。
 */
export default function PrivacyPage() {
  return (
    <PageBody>
      <div className="mx-auto max-w-2xl space-y-6 py-8 text-sm leading-relaxed text-gray-700">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">隱私權政策</h1>
          <p className="mt-1 text-xs text-gray-500">最後更新：2026 年 9 月 4 日</p>
        </div>

        <section className="space-y-2">
          <h2 className="font-medium text-gray-900">我們存取哪些資料</h2>
          <p>
            Archivum 使用 Google 帳號登入，只取得你的姓名、電子郵件與大頭貼，僅用於顯示登入狀態。
            我們不存取你 Google 雲端硬碟裡的任何檔案。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-gray-900">資料存放在哪裡</h2>
          <p>
            你的閱讀紀錄存放在本服務的資料庫（位於 Supabase 東京節點）。標記為「私人」的項目
            在伺服器端就被過濾掉，不會傳到瀏覽器。登入狀態保存在你瀏覽器的加密 cookie 中。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-gray-900">我們不做的事</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>不將你的資料提供、販售或分享給第三方</li>
            <li>不用你的資料投放廣告或訓練模型</li>
            <li>不存取你的 Google 雲端硬碟檔案</li>
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
            移除 Archivum。要刪除閱讀紀錄本身，請直接來信告知，我們會刪除你在資料庫裡的全部資料。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-gray-900">聯絡方式</h2>
          <p>有任何疑問請來信 charliewu500@gmail.com。</p>
        </section>

        <Link href="/reading/books" className="inline-block text-xs text-gray-500 underline">
          回到書籍列表
        </Link>
      </div>
    </PageBody>
  );
}
