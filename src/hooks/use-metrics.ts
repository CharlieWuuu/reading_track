import { useMemo } from "react";
import useSWR from "swr";
import { readCached } from "@/lib/swrCache";
import { useSheetStore } from "@/stores/useSheetStore";
import { Metric } from "@/types/metric";

async function fetcher(url: string): Promise<{ metrics: Metric[] }> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

export function useMetrics() {
  const { sheetId } = useSheetStore();
  const key = sheetId ? `/api/metrics?sheetId=${encodeURIComponent(sheetId)}` : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    fallbackData: readCached<{ metrics: Metric[] }>(key),
  });

  const metrics = useMemo(() => data?.metrics ?? [], [data?.metrics]);

  /** 每則紀事最新的那一次量測；畫面上只顯示它，歷次留在 Sheet 裡當曲線 */
  const latestByEntry = useMemo(() => {
    const map = new Map<string, Metric>();
    for (const metric of metrics) {
      if (!metric.entryId) continue;
      const current = map.get(metric.entryId);
      if (!current || metric.date >= current.date) map.set(metric.entryId, metric);
    }
    return map;
  }, [metrics]);

  return {
    metrics,
    latestByEntry,
    isLoading,
    error: error instanceof Error ? error.message : undefined,
    mutate,
  };
}
