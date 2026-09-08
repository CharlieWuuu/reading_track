import type { Metadata } from "next";
import { PageBody } from "@/components/layout/page-body";
import { HomeView } from "@/features/home/components/home-view";

export const metadata: Metadata = {
  title: "Archivum — 抓住思緒的碎片",
  description: "最近讀了什麼？學到什麼？想到什麼？讓 Archivum 幫你轉成個人生活的週報。",
};

/**
 * 首頁刻意不擋登入、也不轉址到清單頁。
 *
 * Google 的 OAuth 驗證要求首頁能在未登入狀態下說明應用程式用途、
 * 顯示與同意畫面一致的名稱，並提供隱私權政策連結——轉址到登入牆會直接被退件。
 * 已安裝的 PWA 不受影響，manifest 的 start_url 指的是清單頁。
 */
export default function Home() {
  return (
    <PageBody>
      <HomeView />
    </PageBody>
  );
}
