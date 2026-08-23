"use client";

import { SWRConfig } from "swr";
import { localStorageProvider, persistSWRCache } from "@/lib/swr-cache";

/** 背景自動重抓的間隔（10 分鐘）。只收手動紀錄，資料不會自己變，抓太勤只是在燒配額 */
export const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: localStorageProvider,
        // 有舊資料就先畫出來，同時在背景重新抓
        revalidateIfStale: true,
        // 切回分頁不重抓。多開分頁時各分頁各算各的，切幾次就把每分鐘 60 趟的
        // 讀取配額吃光；資料只有自己會改，晚 10 分鐘看到不痛
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        keepPreviousData: true,
        // 切頁面切來切去不要重打，5 秒內視為同一次
        dedupingInterval: 5000,
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
