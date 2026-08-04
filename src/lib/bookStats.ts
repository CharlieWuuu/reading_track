import { Book, splitTags } from "@/types/book";

export interface YearCount {
  year: string;
  count: number;
}

export interface MonthCount {
  month: string;
  count: number;
}

export interface QuarterCount {
  quarter: string;
  count: number;
}

export interface DistributionSlice {
  name: string;
  value: number;
}

function completedBooks(books: Book[]): Book[] {
  return books.filter((b) => b.endDate);
}

export function getKpis(books: Book[]) {
  const done = completedBooks(books);
  const now = new Date();
  const thisYear = now.getFullYear();

  const thisYearCount = done.filter(
    (b) => new Date(b.endDate!).getFullYear() === thisYear
  ).length;

  const years = new Set(done.map((b) => new Date(b.endDate!).getFullYear()));
  const monthsSpanned = years.size > 0 ? years.size * 12 : 1;
  const avgPerMonth = done.length / monthsSpanned;

  return {
    total: done.length,
    thisYear: thisYearCount,
    avgPerMonth: Math.round(avgPerMonth * 10) / 10,
  };
}

export function getYearlyTrend(books: Book[]): YearCount[] {
  const done = completedBooks(books);
  const counts = new Map<string, number>();

  for (const b of done) {
    const year = String(new Date(b.endDate!).getFullYear());
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year));
}

export function getQuarterlyTrend(books: Book[]): QuarterCount[] {
  const done = completedBooks(books);
  if (done.length === 0) return [];

  const counts = new Map<string, number>();
  for (const b of done) {
    const d = new Date(b.endDate!);
    const quarter = Math.floor(d.getMonth() / 3) + 1;
    const key = `${d.getFullYear()}-Q${quarter}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([quarter, count]) => ({ quarter, count }))
    .sort((a, b) => a.quarter.localeCompare(b.quarter));
}

export function getMonthlyTrend(books: Book[], monthsBack = 24): MonthCount[] {
  const done = completedBooks(books);
  const counts = new Map<string, number>();

  const now = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    counts.set(key, 0);
  }

  for (const b of done) {
    const d = new Date(b.endDate!);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries()).map(([month, count]) => ({ month, count }));
}

/**
 * 一格可能放了多個標籤（屬性可複選），每個都各算一次，
 * 所以各項加總會大於書本數——這是分佈圖，不是圓餅百分比。
 */
function distributionBy(books: Book[], key: keyof Book): DistributionSlice[] {
  const counts = new Map<string, number>();
  for (const b of books) {
    const raw = b[key];
    const tags = typeof raw === "string" ? splitTags(raw) : [];
    for (const value of tags.length > 0 ? tags : ["未分類"]) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getDomainDistribution(books: Book[]): DistributionSlice[] {
  return distributionBy(books, "domain");
}

export function getTypeDistribution(books: Book[]): DistributionSlice[] {
  return distributionBy(books, "type");
}

export function getLanguageDistribution(books: Book[]): DistributionSlice[] {
  return distributionBy(books, "language");
}

export function getPlatformDistribution(books: Book[]): DistributionSlice[] {
  return distributionBy(books, "platform");
}
