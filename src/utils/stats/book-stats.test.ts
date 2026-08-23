import { afterEach, describe, expect, it, vi } from "vitest";
import { makeBook, resetIds } from "@/testing/factories";
import { QuoteRow } from "@/types/record";
import {
  getAuthorRanking,
  getCumulativeSeries,
  getDomainDistribution,
  getDomainGroups,
  getKpis,
  getMonthlyTrend,
  getPublisherRanking,
  getQuarterlyTrend,
  getRereadRanking,
  getYearlyTrend,
} from "./book-stats";

resetIds();

function freeze(local: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(local));
}

afterEach(() => {
  vi.useRealTimers();
});

const quote = (bookId: string): QuoteRow => ({ bookId, text: "一句話" }) as unknown as QuoteRow;

/** 統計一律只算讀完的，沒有 endDate 的那些不該進任何一張圖 */
const unfinished = makeBook({ endDate: null, status: "閱讀中" });

describe("getKpis", () => {
  it("只算讀完的", () => {
    freeze("2026-08-19T10:00:00");
    const kpis = getKpis([makeBook({ endDate: "2026-03-01" }), unfinished], []);

    expect(kpis.total).toBe(1);
  });

  it("今年本數只算今年讀完的", () => {
    freeze("2026-08-19T10:00:00");
    const kpis = getKpis(
      [makeBook({ endDate: "2026-03-01" }), makeBook({ endDate: "2025-12-31" })],
      [],
    );

    expect(kpis).toMatchObject({ total: 2, thisYear: 1 });
  });

  // 舊版拿「總本數 ÷ 有紀錄的年份 × 12」，會把幾年前只讀一本的年份算成完整 12 個月
  it("月均是今年本數除以已經過完的月份", () => {
    freeze("2026-08-19T10:00:00"); // 第 8 個月
    const books = Array.from({ length: 4 }, () => makeBook({ endDate: "2026-03-01" }));

    expect(getKpis(books, []).avgPerMonth).toBe(0.5);
  });

  it("有心得的書數：空白不算", () => {
    const books = [makeBook({ note: "寫了" }), makeBook({ note: "   " })];

    expect(getKpis(books, []).withNote).toBe(1);
  });

  it("佳句以「本」為單位，同一本記很多句還是一本", () => {
    const book = makeBook({ id: "b1" });
    const quotes = [quote("b1"), quote("b1"), quote("b1")];

    expect(getKpis([book], quotes).withQuotes).toBe(1);
  });

  it("沒讀完那本的佳句不算進去", () => {
    const quotes = [quote(unfinished.id)];

    expect(getKpis([unfinished], quotes).withQuotes).toBe(0);
  });
});

describe("getYearlyTrend", () => {
  it("照年份由小到大", () => {
    const books = [
      makeBook({ endDate: "2026-01-01" }),
      makeBook({ endDate: "2024-05-01" }),
      makeBook({ endDate: "2026-07-01" }),
    ];

    expect(getYearlyTrend(books)).toEqual([
      { year: "2024", count: 1 },
      { year: "2026", count: 2 },
    ]);
  });
});

describe("getQuarterlyTrend", () => {
  // 空白的季直接跳過的話，X 軸間距就不等於時間長度，趨勢會被壓縮成假的樣子
  it("中間沒讀完書的季別補 0", () => {
    freeze("2026-08-19T10:00:00"); // Q3
    const books = [makeBook({ endDate: "2026-01-15" })];

    expect(getQuarterlyTrend(books)).toEqual([
      { quarter: "2026-Q1", count: 1 },
      { quarter: "2026-Q2", count: 0 },
      { quarter: "2026-Q3", count: 0 },
    ]);
  });

  it("跨年的季別接得起來", () => {
    freeze("2026-02-10T10:00:00"); // Q1
    const books = [makeBook({ endDate: "2025-10-01" })];

    expect(getQuarterlyTrend(books).map((q) => q.quarter)).toEqual(["2025-Q4", "2026-Q1"]);
  });

  it("一本都沒讀完就是空陣列", () => {
    expect(getQuarterlyTrend([unfinished])).toEqual([]);
  });
});

describe("getMonthlyTrend", () => {
  it("回傳固定長度的月份序列，最後一格是這個月", () => {
    freeze("2026-08-19T10:00:00");
    const series = getMonthlyTrend([makeBook({ endDate: "2026-08-05" })], 3);

    expect(series).toEqual([
      { month: "2026-06", count: 0 },
      { month: "2026-07", count: 0 },
      { month: "2026-08", count: 1 },
    ]);
  });

  it("範圍外的舊書不會被算進來，也不會多長一格", () => {
    freeze("2026-08-19T10:00:00");
    const series = getMonthlyTrend([makeBook({ endDate: "2020-01-01" })], 3);

    expect(series.every((m) => m.count === 0)).toBe(true);
    expect(series).toHaveLength(3);
  });
});

describe("分佈", () => {
  it("多值的一格每個都各算一次", () => {
    const books = [makeBook({ domain: "心理、社會" }), makeBook({ domain: "心理" })];

    expect(getDomainDistribution(books)).toEqual([
      { name: "心理", value: 2 },
      { name: "社會", value: 1 },
    ]);
  });

  it("沒填的歸「未分類」", () => {
    expect(getDomainDistribution([makeBook({ domain: "" })])).toEqual([
      { name: "未分類", value: 1 },
    ]);
  });

  it("由多到少排序", () => {
    const books = [
      makeBook({ domain: "社會" }),
      makeBook({ domain: "心理" }),
      makeBook({ domain: "心理" }),
    ];

    expect(getDomainDistribution(books).map((s) => s.name)).toEqual(["心理", "社會"]);
  });
});

describe("getDomainGroups", () => {
  // 造一個「其他」會讓「心理」看起來有一個叫其他的子分類
  it("沒填次領域的歸在跟領域同名的格子", () => {
    const books = [makeBook({ domain: "心理", subDomain: "" })];

    expect(getDomainGroups(books)).toEqual([
      { name: "心理", children: [{ name: "心理", value: 1 }] },
    ]);
  });

  it("領域照總數排，子項也照數量排", () => {
    const books = [
      makeBook({ domain: "心理", subDomain: "正念" }),
      makeBook({ domain: "心理", subDomain: "正念" }),
      makeBook({ domain: "心理", subDomain: "依附" }),
      makeBook({ domain: "社會", subDomain: "media" }),
    ];

    const groups = getDomainGroups(books);
    expect(groups.map((g) => g.name)).toEqual(["心理", "社會"]);
    expect(groups[0].children).toEqual([
      { name: "正念", value: 2 },
      { name: "依附", value: 1 },
    ]);
  });
});

describe("排行", () => {
  // 出現一次的佔長尾的絕大多數，全列出來只是把圖表塞滿無法比較的長條
  it("只上榜累積 2 本以上的", () => {
    const books = [
      makeBook({ publisher: "早安財經" }),
      makeBook({ publisher: "早安財經" }),
      makeBook({ publisher: "只出現一次" }),
    ];

    expect(getPublisherRanking(books)).toEqual([
      { name: "早安財經", value: 2, coverUrl: undefined },
    ]);
  });

  it("一格擠好幾個作者要拆開各算各的", () => {
    const books = [
      makeBook({ author: "A、B" }),
      makeBook({ author: "B" }),
      makeBook({ author: "C" }),
    ];

    expect(getAuthorRanking(books).map((r) => r.name)).toEqual(["B"]);
  });

  it("抓回來夾著的「關注」會被清掉", () => {
    const books = [makeBook({ author: "張三 關注" }), makeBook({ author: "張三" })];

    expect(getAuthorRanking(books)[0].name).toBe("張三");
  });

  it("代表書封取第一本有封面的", () => {
    const books = [
      makeBook({ publisher: "早安財經", coverUrl: "" }),
      makeBook({ publisher: "早安財經", coverUrl: "https://example.com/2.jpg" }),
    ];

    expect(getPublisherRanking(books)[0].coverUrl).toBe("https://example.com/2.jpg");
  });

  // 每讀一次就是新增一列，重讀那列的 originId 指回第一次
  it("重讀看的是 originId，不是書名", () => {
    const books = [
      makeBook({ id: "b1", title: "被討厭的勇氣" }),
      makeBook({ id: "b2", title: "被討厭的勇氣", originId: "b1" }),
    ];

    expect(getRereadRanking(books)).toMatchObject([{ name: "被討厭的勇氣", value: 2 }]);
  });

  it("同名但沒有連結的兩列是兩本不同的書，不算重讀", () => {
    const books = [makeBook({ id: "b1", title: "筆記" }), makeBook({ id: "b2", title: "筆記" })];

    expect(getRereadRanking(books)).toEqual([]);
  });

  it("書名取源頭那一列的：重讀時補上的副標不該換掉排行上的名字", () => {
    const books = [
      makeBook({ id: "b1", title: "深度工作力" }),
      makeBook({ id: "b2", title: "深度工作力：淺薄時代的關鍵能力", originId: "b1" }),
    ];

    expect(getRereadRanking(books)[0].name).toBe("深度工作力");
  });

  it("還沒讀完的那次不算又讀了一次", () => {
    const books = [
      makeBook({ title: "被討厭的勇氣" }),
      makeBook({ title: "被討厭的勇氣", endDate: null, status: "閱讀中" }),
    ];

    expect(getRereadRanking(books)).toEqual([]);
  });

  it("超過名額就截斷", () => {
    const books = ["A", "B", "C"].flatMap((p) => [
      makeBook({ publisher: p }),
      makeBook({ publisher: p }),
    ]);

    expect(getPublisherRanking(books, 2)).toHaveLength(2);
  });
});

describe("getCumulativeSeries", () => {
  it("不分組時只有一條，數字一路累加不會下降", () => {
    const { keys, rows } = getCumulativeSeries([
      makeBook({ endDate: "2026-01-15" }),
      makeBook({ endDate: "2026-05-15" }),
      makeBook({ endDate: "2026-05-20" }),
    ]);
    expect(keys).toEqual(["總計"]);
    // Q1 一本、Q2 兩本，之後的季沒有新的就維持在 3
    const totals = rows.map((r) => Number(r.總計));
    expect(totals.slice(0, 2)).toEqual([1, 3]);
    expect(totals.at(-1)).toBe(3);
    expect(totals.every((n, i) => i === 0 || n >= totals[i - 1])).toBe(true);
  });

  it("按領域拆開之後，每一季加起來等於總計", () => {
    const books = [
      makeBook({ endDate: "2026-01-15", domain: "心理" }),
      makeBook({ endDate: "2026-01-20", domain: "歷史" }),
    ];
    const split = getCumulativeSeries(books, "domain");
    const total = getCumulativeSeries(books);
    const summed = split.rows.map((row) =>
      split.keys.reduce((sum, key) => sum + Number(row[key] ?? 0), 0),
    );
    expect(summed).toEqual(total.rows.map((r) => r.總計));
  });

  it("沒填領域的算「未分類」，不是丟掉", () => {
    const { keys } = getCumulativeSeries(
      [makeBook({ endDate: "2026-01-15", domain: "" })],
      "domain",
    );
    expect(keys).toEqual(["未分類"]);
  });

  it("沒有讀完的書就沒有線", () => {
    expect(getCumulativeSeries([makeBook({ endDate: null })])).toEqual({ keys: [], rows: [] });
  });
});
