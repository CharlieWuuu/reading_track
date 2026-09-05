"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { useMounted } from "@/hooks/use-mounted";

type DataGateProps = {
  isLoading: boolean;
  error?: string;
  /** 資料抓回來了但一筆都沒有時要說的話；不給就照樣畫下去 */
  emptyText?: string;
  isEmpty?: boolean;
  /** 訊息框撐滿剩下的高度，讓它跟正常內容佔一樣的空間，切換時版面不跳 */
  fill?: boolean;
  children: React.ReactNode;
};

/**
 * 「載入中／出錯／沒資料」這三關，每個看板都要走一次。
 *
 * 各頁各寫一份會慢慢長歪（有的少一關、有的訊息不一樣），收成一個元件之後
 * 只剩「這一頁的空狀態要說什麼」是各自的事。
 */
export function DataGate({
  isLoading,
  error,
  emptyText,
  isEmpty = false,
  fill = false,
  children,
}: DataGateProps) {
  const mounted = useMounted();

  // 伺服器端不知道有沒有解鎖（那存在 localStorage），先不畫免得閃一下
  if (!mounted) return null;
  if (isLoading) return <PageLoading fill={fill} />;
  if (error)
    return (
      <PageMessage tone="error" fill={fill}>
        {error}
      </PageMessage>
    );
  if (isEmpty && emptyText) return <PageMessage fill={fill}>{emptyText}</PageMessage>;

  return <>{children}</>;
}
