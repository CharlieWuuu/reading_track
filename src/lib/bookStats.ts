import { Book, parseQuotes, splitTags } from "@/types/book";

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

  const thisYearCount = done.filter((b) => new Date(b.endDate!).getFullYear() === thisYear).length;

  // 今年到目前為止的節奏：今年完成本數 ÷ 已經過完的月份數（8 月就除以 8）。
  // 原本是拿「總本數 ÷ 有紀錄的年份 × 12」，會把幾年前只讀一本的年份也算成完整 12 個月。
  const avgPerMonth = thisYearCount / (now.getMonth() + 1);

  // 有寫筆記的書、記下來的佳句數：鼓勵留下心得，不只看讀了幾本
  const withNote = books.filter((b) => b.note.trim()).length;
  // 以「本」為單位：同一本記了很多句也算一本，跟「寫了心得」同一個口徑
  const withQuotes = books.filter((b) => parseQuotes(b.quotes).length > 0).length;

  return {
    total: done.length,
    thisYear: thisYearCount,
    avgPerMonth: Math.round(avgPerMonth * 10) / 10,
    withNote,
    withQuotes,
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

/**
 * 每季完成本數。沒讀完任何一本的季別要補 0——把空白的季直接跳過，
 * X 軸的間距就不再等於時間長度，趨勢會被壓縮成假的樣子。
 */
export function getQuarterlyTrend(books: Book[]): QuarterCount[] {
  const done = completedBooks(books);
  if (done.length === 0) return [];

  const counts = new Map<string, number>();
  for (const b of done) {
    const d = new Date(b.endDate!);
    const quarter = Math.floor(d.getMonth() / 3) + 1;
    counts.set(
      `${d.getFullYear()}-Q${quarter}`,
      (counts.get(`${d.getFullYear()}-Q${quarter}`) ?? 0) + 1,
    );
  }

  const times = done.map((b) => new Date(b.endDate!)).filter((d) => !Number.isNaN(d.getTime()));
  const first = new Date(Math.min(...times.map((d) => d.getTime())));
  const now = new Date();

  const series: QuarterCount[] = [];
  let year = first.getFullYear();
  let quarter = Math.floor(first.getMonth() / 3) + 1;
  const lastYear = now.getFullYear();
  const lastQuarter = Math.floor(now.getMonth() / 3) + 1;

  while (year < lastYear || (year === lastYear && quarter <= lastQuarter)) {
    const key = `${year}-Q${quarter}`;
    series.push({ quarter: key, count: counts.get(key) ?? 0 });
    if (quarter === 4) {
      quarter = 1;
      year++;
    } else {
      quarter++;
    }
  }

  return series;
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

/**
 * 作者欄位常常是好幾個人擠在一格（「A、B」），
 * 而且從某些來源抓回來的會夾著「關注」這種按鈕文字，一併清掉。
 */
function splitPeople(raw: string): string[] {
  return raw
    .replace(/\s*關注\s*/g, "、")
    .split(/[、,，;；/／]|\s{2,}/)
    .map((name) => name.trim())
    .filter(Boolean);
}

/** 排行的一列：除了名次資料，另外帶一張代表性書封 */
export interface RankingItem extends DistributionSlice {
  coverUrl?: string;
}

/**
 * 出版社／作者／重讀排行：只有累積 2 本（次）以上的才上榜——出現一次的佔了長尾的
 * 絕大多數，全列出來只是把圖表塞滿無法比較的長條。
 */
export function getPublisherRanking(books: Book[], limit = 5): RankingItem[] {
  return rank(
    books.map((b) => ({ names: b.publisher.trim() ? [b.publisher.trim()] : [], book: b })),
    limit,
  );
}

export function getAuthorRanking(books: Book[], limit = 5): RankingItem[] {
  return rank(
    books.map((b) => ({ names: splitPeople(b.author), book: b })),
    limit,
  );
}

/**
 * 重讀排行：同一本書在表裡有幾筆讀完的紀錄就是讀過幾次。
 *
 * 用書名比對而不是 id——每讀一次就是新增一列，兩列的 id 本來就不同。
 * 只算「已讀完」的，想讀／閱讀中那筆還沒完成，不該算成又讀了一次。
 */
export function getRereadRanking(books: Book[], limit = 5): RankingItem[] {
  return rank(
    completedBooks(books).map((b) => ({ names: b.title.trim() ? [b.title.trim()] : [], book: b })),
    limit,
  );
}

function rank(groups: Array<{ names: string[]; book: Book }>, limit: number): RankingItem[] {
  const counts = new Map<string, number>();
  // 代表書封：取第一本有封面的，作者／出版社就用他最近的一本書當代表
  const covers = new Map<string, string>();

  for (const { names, book } of groups) {
    for (const name of names) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
      if (!covers.has(name) && book.coverUrl) covers.set(name, book.coverUrl);
    }
  }

  return Array.from(counts.entries())
    .filter(([, value]) => value >= 2)
    .map(([name, value]) => ({ name, value, coverUrl: covers.get(name) }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "zh-Hant"))
    .slice(0, limit);
}
