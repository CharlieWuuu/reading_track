import { Book, splitTags } from "@/types/book";
import { QuoteRow } from "@/types/record";
import { rootId } from "@/utils/book-reads";

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

export function getKpis(books: Book[], quotes: QuoteRow[]) {
  const done = completedBooks(books);
  const now = new Date();
  const thisYear = now.getFullYear();

  const thisYearCount = done.filter((b) => new Date(b.endDate!).getFullYear() === thisYear).length;

  // 今年到目前為止的節奏：今年完成本數 ÷ 已經過完的月份數（8 月就除以 8）。
  // 原本是拿「總本數 ÷ 有紀錄的年份 × 12」，會把幾年前只讀一本的年份也算成完整 12 個月。
  const avgPerMonth = thisYearCount / (now.getMonth() + 1);

  // 有寫筆記的書、記下來的佳句數：鼓勵留下心得，不只看讀了幾本
  const withNote = done.filter((b) => b.note.trim()).length;
  // 以「本」為單位：同一本記了很多句也算一本，跟「寫了心得」同一個口徑
  const doneIds = new Set(done.map((b) => b.id));
  const withQuotes = new Set(quotes.map((q) => q.bookId).filter((id) => doneIds.has(id))).size;

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
/** 累積曲線的一列：季 + 每個系列到這一季為止的累積量 */
export type CumulativeRow = { quarter: string } & Record<string, number | string>;

/** 分開畫幾條線就夠了；再多顏色分不出來，尾巴併成「其他」 */
const CUMULATIVE_SERIES_LIMIT = 6;
const OTHER = "其他";

/**
 * 累積完成本數，可以再按某個欄位拆成幾條堆疊起來的線。
 *
 * 不拆的時候只有一條「總計」——那跟拆開之後的總高度是同一個數字，
 * 所以三種看法共用同一支函式，差別只在分幾組。
 */
export function getCumulativeSeries(
  books: Book[],
  field?: "domain" | "type",
): { keys: string[]; rows: CumulativeRow[] } {
  const quarters = getQuarterlyTrend(books).map((q) => q.quarter);
  if (quarters.length === 0) return { keys: [], rows: [] };

  // 這一季各組各完成幾本
  const perQuarter = new Map<string, Map<string, number>>();
  const totals = new Map<string, number>();
  for (const book of completedBooks(books)) {
    const date = new Date(book.endDate!);
    const key = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
    // 一格可以放多個屬性，領域雖然是單選、舊資料仍可能是頓號串的
    const raw = field ? splitTags(book[field]) : [];
    const names = field ? (raw.length > 0 ? raw : ["未分類"]) : ["總計"];
    for (const name of names) {
      const row = perQuarter.get(key) ?? new Map<string, number>();
      row.set(name, (row.get(name) ?? 0) + 1);
      perQuarter.set(key, row);
      totals.set(name, (totals.get(name) ?? 0) + 1);
    }
  }

  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  const kept = ranked.slice(0, CUMULATIVE_SERIES_LIMIT);
  const overflow = new Set(ranked.slice(CUMULATIVE_SERIES_LIMIT));
  const keys = overflow.size > 0 ? [...kept, OTHER] : kept;

  const running = new Map<string, number>(keys.map((key) => [key, 0]));
  const rows = quarters.map((quarter) => {
    for (const [name, count] of perQuarter.get(quarter) ?? []) {
      const key = overflow.has(name) ? OTHER : name;
      running.set(key, (running.get(key) ?? 0) + count);
    }
    return { quarter, ...Object.fromEntries(running) } as CumulativeRow;
  });

  return { keys, rows };
}

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
  for (const b of completedBooks(books)) {
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

export interface DistributionGroup {
  name: string;
  children: DistributionSlice[];
}

/**
 * 領域底下再分次領域。沒填次領域的書歸在一個跟領域同名的格子裡，
 * 不另外造一個「其他」——那會讓「心理」看起來有一個叫其他的子分類。
 */
export function getDomainGroups(books: Book[]): DistributionGroup[] {
  const groups = new Map<string, Map<string, number>>();

  // 跟其他分佈圖同一個口徑：只算讀完的
  for (const book of completedBooks(books)) {
    const domains = splitTags(book.domain);
    for (const domain of domains.length > 0 ? domains : ["未分類"]) {
      const children = groups.get(domain) ?? new Map<string, number>();
      const leaf = book.subDomain.trim() || domain;
      children.set(leaf, (children.get(leaf) ?? 0) + 1);
      groups.set(domain, children);
    }
  }

  return [...groups.entries()]
    .map(([name, children]) => ({
      name,
      children: [...children.entries()]
        .map(([child, value]) => ({ name: child, value }))
        .sort((a, b) => b.value - a.value),
    }))
    .sort(
      (a, b) =>
        b.children.reduce((sum, c) => sum + c.value, 0) -
        a.children.reduce((sum, c) => sum + c.value, 0),
    );
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
    completedBooks(books).map((b) => ({
      names: b.publisher.trim() ? [b.publisher.trim()] : [],
      book: b,
    })),
    limit,
  );
}

export function getAuthorRanking(books: Book[], limit = 5): RankingItem[] {
  return rank(
    completedBooks(books).map((b) => ({ names: splitPeople(b.author), book: b })),
    limit,
  );
}

/**
 * 重讀排行：同一本書在表裡有幾筆讀完的紀錄就是讀過幾次。
 *
 * 用 `originId` 認人（見 `utils/book-reads.ts`），不用書名。書名會把「同名的
 * 兩本不同書」算成重讀，也會因為一次打錯字就讓同一本書分裂成兩筆。
 *
 * 代價是沒有補連結的舊資料會散開——那要人一組一組確認過（設定→資料維護的
 * 「補同一本書編號」），不是程式猜得出來的。
 *
 * 書名取源頭那一列的：重讀時副標可能補得比較完整，但排行上要的是同一個名字。
 * 只算「已讀完」的，想讀／閱讀中那筆還沒完成，不該算成又讀了一次。
 */
export function getRereadRanking(books: Book[], limit = 5): RankingItem[] {
  const counts = new Map<string, number>();
  const titles = new Map<string, string>();
  const covers = new Map<string, string>();

  for (const book of completedBooks(books)) {
    const key = rootId(book);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    const title = book.title.trim();
    // 源頭那一列的書名優先；源頭沒讀完（不在這裡）就用第一個有名字的
    if (title && (book.id === key || !titles.get(key))) titles.set(key, title);
    if (!covers.has(key) && book.coverUrl) covers.set(key, book.coverUrl);
  }

  return [...counts.entries()]
    .filter(([key, value]) => value >= 2 && titles.get(key))
    .map(([key, value]) => ({
      name: titles.get(key)!,
      value,
      coverUrl: covers.get(key),
    }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "zh-Hant"))
    .slice(0, limit);
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
