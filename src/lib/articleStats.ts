import { InstapaperBookmark } from "@/lib/instapaper/client";
import { DistributionSlice, MonthCount } from "@/lib/bookStats";

export const COMPLETION_THRESHOLD = 0.9;

export function isCompleted(a: InstapaperBookmark): boolean {
  return (a.progress ?? 0) >= COMPLETION_THRESHOLD;
}

function activityTime(a: InstapaperBookmark): number {
  return a.progress_timestamp || a.time;
}

export function getArticleKpis(articles: InstapaperBookmark[]) {
  const completed = articles.filter(isCompleted);
  const now = new Date();
  const thisYear = now.getFullYear();

  const thisYearCount = completed.filter(
    (a) => new Date(activityTime(a) * 1000).getFullYear() === thisYear
  ).length;

  return {
    total: articles.length,
    completed: completed.length,
    thisYear: thisYearCount,
  };
}

export function getCompletionDistribution(
  articles: InstapaperBookmark[]
): DistributionSlice[] {
  const completed = articles.filter(isCompleted).length;
  return [
    { name: "已讀完", value: completed },
    { name: "未讀完", value: articles.length - completed },
  ];
}

export function getArticleMonthlyTrend(
  articles: InstapaperBookmark[],
  monthsBack = 24
): MonthCount[] {
  const completed = articles.filter(isCompleted);
  const counts = new Map<string, number>();

  const now = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    counts.set(key, 0);
  }

  for (const a of completed) {
    const d = new Date(activityTime(a) * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries()).map(([month, count]) => ({ month, count }));
}

export function getSourceDistribution(
  articles: InstapaperBookmark[]
): DistributionSlice[] {
  const counts = new Map<string, number>();
  for (const a of articles.filter(isCompleted)) {
    let host = "未知";
    try {
      host = new URL(a.url).hostname.replace(/^www\./, "");
    } catch {
      // ignore malformed URLs
    }
    counts.set(host, (counts.get(host) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getFolderDistribution(
  articles: InstapaperBookmark[]
): DistributionSlice[] {
  const counts = new Map<string, number>();
  for (const a of articles) {
    counts.set(a.folder, (counts.get(a.folder) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export interface FolderMonthPoint {
  month: string;
  [seriesKey: string]: number | string;
}

export interface FolderSeries {
  folder: string;
  completedKey: string;
  incompleteKey: string;
}

export function getFolderMonthlyTrend(
  articles: InstapaperBookmark[],
  monthsBack = 24
): { data: FolderMonthPoint[]; series: FolderSeries[] } {
  const folders = Array.from(new Set(articles.map((a) => a.folder)));

  const now = new Date();
  const months: string[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const series: FolderSeries[] = folders.map((folder) => ({
    folder,
    completedKey: `${folder}__completed`,
    incompleteKey: `${folder}__incomplete`,
  }));

  const data: FolderMonthPoint[] = months.map((month) => {
    const point: FolderMonthPoint = { month };
    for (const s of series) {
      point[s.completedKey] = 0;
      point[s.incompleteKey] = 0;
    }
    return point;
  });
  const byMonth = new Map(data.map((d) => [d.month, d]));

  for (const a of articles) {
    const d = new Date((a.progress_timestamp || a.time) * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const point = byMonth.get(key);
    if (!point) continue;
    const s = series.find((s) => s.folder === a.folder)!;
    const targetKey = isCompleted(a) ? s.completedKey : s.incompleteKey;
    point[targetKey] = (point[targetKey] as number) + 1;
  }

  return { data, series };
}
