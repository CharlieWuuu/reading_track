"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { useMounted } from "@/hooks/use-mounted";

type RecordGateProps = {
  loading?: boolean;
  error?: string;
  /** 抓完了卻找不到那一筆時要說的話；給了字串就代表沒找到 */
  missing?: string | false | null;
  children: React.ReactNode;
};

/**
 * 每個吃資料的頁面都要先過這幾關：還沒掛載、載入中、出錯、找不到。
 *
 * 順序有意義，寫錯就會說謊——「找不到這一筆」必須排在載入中後面，
 * 不然資料還在路上就先告訴使用者東西不存在。這種判斷不該在九個頁面各寫一次。
 *
 * BooksGate 是同一件事的另一種形狀（它順便把書丟給 children），
 * 兩者共用的部分就是這裡的幾關。
 *
 * 訊息一律 fill：它跟正常內容佔一樣的高度，切換時版面不會跳，文字也才會落在正中間。
 */
export function RecordGate({ loading, error, missing, children }: RecordGateProps) {
  const mounted = useMounted();

  // 還沒掛載完就什麼都別說，免得閃一下
  if (!mounted) return null;
  if (loading) return <PageLoading />;
  if (error)
    return (
      <PageMessage tone="error" fill>
        {error}
      </PageMessage>
    );
  if (missing) return <PageMessage fill>{missing}</PageMessage>;

  return <>{children}</>;
}
