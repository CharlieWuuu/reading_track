"use client";

import { KindNewPage } from "@/features/kinds/kind-route-shell";

/**
 * 這一種有專屬的清單頁（../page.tsx）與詳情頁（../[id]），所以 /new 會被
 * 動態路由當成一筆的編號吃掉——靜態這一條勝出，導回通用的新增表單。
 */
export default function NewPage() {
  return <KindNewPage group="fragments" slug="vocabulary" />;
}
