"use client";

import { Spinner } from "@/components/ui/spinner";
import { useDelayed } from "@/hooks/use-delayed";

/**
 * 頁面層級的載入中：撐滿剩下的空間，轉圈圈擺正中央。
 *
 * 不套 PageMessage：那是一個有底色的方塊，只為了放一顆轉圈圈就畫一個框，
 * 看起來像「載入中」是一則內容。
 *
 * 前 250 毫秒什麼都不畫：資料在快取裡時載入是一瞬間的事，閃一下反而像壞了。
 */
export function PageLoading({ fill = true }: { fill?: boolean }) {
  const show = useDelayed(250);
  if (!show) return null;

  return (
    <div className={`flex w-full items-center justify-center ${fill ? "min-h-0 flex-1" : "py-16"}`}>
      <Spinner size={24} className="text-gray-400" />
    </div>
  );
}
