"use client";

import { useState } from "react";
import { useMounted } from "@/hooks/use-mounted";
import { cachedBytes, clearSWRCache } from "@/lib/swr-cache";
import { CACHE_BUDGET_BYTES } from "@/utils/cache-budget";

function mb(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(2)} MB`;
}

/**
 * 本機快取多大。
 *
 * 有這個數字才知道「資料越來越多」是不是真的成了問題——localStorage 一個
 * origin 大約 5MB，超過就開始丟東西。沒有量測之前，任何「要不要做分頁」
 * 的討論都是猜的。
 */
export function CachePanel() {
  // localStorage 只有瀏覽器有，掛載完才量得到；伺服器端算出來的數字會跟畫面對不上
  const mounted = useMounted();
  const [cleared, setCleared] = useState(false);

  if (!mounted) return null;

  const bytes = cleared ? 0 : cachedBytes();
  const ratio = Math.round((bytes / CACHE_BUDGET_BYTES) * 100);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500">
        本機快取 {mb(bytes)}，額度 {mb(CACHE_BUDGET_BYTES)}（{ratio}%）。
        超過額度時最大的那幾張表不落地，畫面照常，只是開啟時要等載入。
      </p>
      <button
        type="button"
        onClick={() => {
          clearSWRCache();
          setCleared(true);
        }}
        className="rounded-control text-control-ink bg-control-bg hover:bg-control-bg-hover self-start px-4 py-2 text-sm font-medium"
      >
        清掉本機快取
      </button>
    </div>
  );
}
