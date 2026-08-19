"use client";

import { PageMessage } from "@/components/layout/PageMessage";
import { useMounted } from "@/hooks/useMounted";
import { useSheetStore } from "@/store/useSheetStore";

type RecordGateProps = {
  loading?: boolean;
  error?: string;
  /** 抓完了卻找不到那一筆時要說的話；給了字串就代表沒找到 */
  missing?: string | false | null;
  children: React.ReactNode;
};

/**
 * 每個吃資料的頁面都要先過這幾關：還沒掛載、沒連 Sheet、載入中、出錯、找不到。
 *
 * 順序有意義，寫錯就會說謊——「找不到這一筆」必須排在載入中後面，
 * 不然資料還在路上就先告訴使用者東西不存在。這種判斷不該在九個頁面各寫一次。
 *
 * BooksGate 是同一件事的另一種形狀（它順便把書丟給 children），
 * 兩者共用的部分就是這裡的四關。
 */
export function RecordGate({ loading, error, missing, children }: RecordGateProps) {
  const { sheetId } = useSheetStore();
  const mounted = useMounted();

  // 還沒掛載完就什麼都別說，免得閃一下「請先連接」
  if (!mounted) return null;
  if (!sheetId) return <PageMessage>請先到「設定」頁面連接 Google Sheet</PageMessage>;
  if (loading) return <PageMessage>載入中…</PageMessage>;
  if (error) return <PageMessage tone="error">{error}</PageMessage>;
  if (missing) return <PageMessage>{missing}</PageMessage>;

  return <>{children}</>;
}
