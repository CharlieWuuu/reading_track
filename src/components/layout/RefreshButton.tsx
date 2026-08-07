"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useSWRConfig } from "swr";

/** 手動重抓所有資料，順便顯示上次更新時間 */
export function RefreshButton({ compact = false }: { compact?: boolean }) {
  const { mutate } = useSWRConfig();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      // 第一個參數傳 () => true 代表重抓目前所有的 key
      await mutate(() => true);
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isRefreshing}
      title={
        lastUpdated
          ? `上次更新 ${lastUpdated.toLocaleTimeString("zh-Hant", {
              hour: "2-digit",
              minute: "2-digit",
            })}`
          : "重新整理資料"
      }
      aria-label="重新整理資料"
      /* 固定 h-8，跟同一排的頭像與「新增書籍」對齊 */
      className={`flex h-8 items-center gap-1.5 rounded border border-gray-900 text-xs font-medium transition-colors hover:bg-gray-900 hover:text-white disabled:opacity-50 ${
        compact ? "w-8 justify-center" : "px-2"
      }`}
    >
      <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} aria-hidden />
      {!compact && <span>{isRefreshing ? "更新中" : "重新整理"}</span>}
    </button>
  );
}
