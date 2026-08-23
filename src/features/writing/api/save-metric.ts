import { Metric } from "@/types/metric";

/**
 * 記一次數字。同一則紀事會有好幾筆，靠日期分先後——
 * 這張表是「那天看到多少」，不是「現在有多少」。
 */
export async function saveMetric(sheetId: string, metric: Metric): Promise<void> {
  const res = await fetch("/api/metrics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sheetId, metric }),
  });
  if (!res.ok) throw new Error("寫入失敗");
}
