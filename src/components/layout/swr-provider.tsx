"use client";

import { SWRConfig } from "swr";
import { localStorageProvider, persistSWRCache } from "@/lib/swr-cache";

/** 背景自動重抓的間隔（5 分鐘） */
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: localStorageProvider,
        // 有舊資料就先畫出來，同時在背景重新抓
        revalidateIfStale: true,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        keepPreviousData: true,
        // 切頁面切來切去不要重打，5 秒內視為同一次
        dedupingInterval: 5000,
        focusThrottleInterval: 60_000,
        refreshInterval: REFRESH_INTERVAL_MS,
        refreshWhenHidden: false,
        errorRetryCount: 3,
        // 一抓到新資料就寫回 localStorage，下次開啟直接用舊資料墊畫面，
        // 不用等網路回來才看得到東西
        onSuccess: () => persistSWRCache(),
      }}
    >
      {children}
    </SWRConfig>
  );
}
