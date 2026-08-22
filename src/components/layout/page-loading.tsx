"use client";

import { PageMessage } from "@/components/layout/page-message";
import { Spinner } from "@/components/ui/spinner";
import { useDelayed } from "@/hooks/use-delayed";

/**
 * 頁面層級的載入中。跟 PageMessage 佔一樣的位置，只是裡面是轉圈圈不是文字。
 *
 * 前 250 毫秒什麼都不畫：資料在快取裡時載入是一瞬間的事，閃一下反而像壞了。
 */
export function PageLoading({ fill = false }: { fill?: boolean }) {
  const show = useDelayed(250);
  if (!show) return null;

  return (
    <PageMessage fill={fill}>
      <Spinner size={20} className="text-gray-400" />
    </PageMessage>
  );
}
