import type { Metadata } from "next";
import { BackLink } from "@/components/layout/back-link";
import { PageBody } from "@/components/layout/page-body";

export const metadata: Metadata = {
  title: "隱私權政策｜Archivum",
  description: "Archivum 如何處理你的資料",
};

const styles = {
  page: "mx-auto max-w-2xl space-y-6 py-8 text-sm leading-relaxed text-gray-700",
  h2: "font-medium text-gray-900",
  section: "space-y-2",
};

/**
 * Google OAuth 驗證與 Play 上架都要求一個公開可讀的隱私權政策網址，
 * 所以這頁刻意不放在登入牆後面。
 */
export default function PrivacyPage() {
  return (
    <PageBody>
      <div className={styles.page}>
        <div>
          <BackLink href="/" className="text-ink-faint hover:text-ink mb-2 -ml-1 inline-block" />
          <h1 className="text-xl font-semibold text-gray-900">隱私權政策</h1>
          <p className="mt-1 text-xs text-gray-500">最後更新：2026 年 9 月 8 日</p>
        </div>

        <section className={styles.section}>
          <h2 className={styles.h2}>登入時取得什麼</h2>
          <p>
            用 Google 帳號登入時取得姓名、電子郵件與大頭貼，用來顯示登入狀態、
            並把資料掛在你的帳號底下。授權範圍僅止於此，你 Google 帳號裡的其他東西
            （雲端硬碟、信件、聯絡人）本服務都沒有權限。 另有帳號密碼登入，供沒有 Google
            帳號的人使用，沒有公開註冊入口。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>存了哪些資料</h2>
          <p>
            站上的資料都是你手動輸入的：紀錄（書籍、文章、電影、Podcast 等）、
            片段（佳句、單字、關鍵字）與專欄（日記、心得、論述）。
            這是它唯一的資料來源，沒有背景蒐集，也沒有串接其他 App。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>資料存放在哪裡</h2>
          <p>
            存在本服務的 PostgreSQL 資料庫（由 Supabase 託管）。標記為「私人」的項目
            在伺服器端就被過濾掉，別人看到的清單、數量與搜尋結果裡都不會有它。
            登入狀態保存在你瀏覽器的加密 cookie 中。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>資料的用途</h2>
          <p>
            只用來把你自己的東西顯示回你自己的畫面上，以及算出你的統計與週報。
            不販售、不分享給第三方，也不用於廣告或訓練模型。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>什麼時候會對外查詢</h2>
          <p>
            按「補齊資料」或貼上網址時，會把書名、網址或關鍵字送到公開的資料來源查詢： Google
            Books、Open Library、國立國會圖書館、Readmoo、Pubu、TAAZE， 關鍵字則查 Wikipedia 與
            Wikidata。送出去的只有查詢字串本身。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>如何刪除資料</h2>
          <p>
            紀錄可以在站內逐筆刪除。在「個人資訊」頁登出會清除本服務保存的登入狀態；
            要完全解除授權，到{" "}
            <a
              className="underline"
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 帳號的第三方應用程式頁面
            </a>
            移除 Archivum。
          </p>
        </section>
      </div>
    </PageBody>
  );
}
