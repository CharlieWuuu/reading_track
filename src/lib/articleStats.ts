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

/**
 * 來源網站排行：全部文章都算，並且分成已完成與未完成兩段。
 *
 * 網域只取第一段（去掉 www 之後的第一個標籤），像 medium.com 就顯示 medium——
 * 完整網域太長，在長條旁邊會被截斷，反而看不出是哪個站。
 */
export function getSourceRanking(
  articles: InstapaperBookmark[],
  limit = 8
): Array<DistributionSlice & { doneValue: number }> {
  const totals = new Map<string, { value: number; doneValue: number }>();

  for (const a of articles) {
    const name = sourceName(a.url);
    const entry = totals.get(name) ?? { value: 0, doneValue: 0 };
    entry.value++;
    if (isCompleted(a)) entry.doneValue++;
    totals.set(name, entry);
  }

  return Array.from(totals.entries())
    .map(([name, entry]) => ({ name, ...entry }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function sourceName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.split(".")[0] || host;
  } catch {
    return "未知";
  }
}

/**
 * 文章的「屬性」＝使用者在 Instapaper 上自己加的標籤。
 * 一篇可以有多個標籤，每個各算一次，所以加總會大於文章數。
 */
export function getTagDistribution(
  articles: InstapaperBookmark[]
): DistributionSlice[] {
  const counts = new Map<string, number>();
  for (const a of articles) {
    const names = (a.tags ?? []).map((t) => t.name?.trim()).filter(Boolean) as string[];
    for (const name of names.length > 0 ? names : ["未分類"]) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
