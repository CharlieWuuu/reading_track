import { useMemo } from "react";
import useSWR from "swr";
import { readCached } from "@/lib/swr-cache";
import { useSheetStore } from "@/stores/use-sheet-store";
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
  const latestByWriting = useMemo(() => {
    const map = new Map<string, Metric>();
    for (const metric of metrics) {
      if (!metric.writingId) continue;
      const current = map.get(metric.writingId);
      if (!current || metric.date >= current.date) map.set(metric.writingId, metric);
    }
    return map;
  }, [metrics]);

  return {
    metrics,
    latestByWriting,
    isLoading,
    error: error instanceof Error ? error.message : undefined,
    mutate,
  };
}
