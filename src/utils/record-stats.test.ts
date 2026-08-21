import { afterEach, describe, expect, it, vi } from "vitest";
import { getFieldDistribution, getRecordKpis, getRecordMonthlyTrend } from "./record-stats";

function freeze(local: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(local));
}

afterEach(() => {
  vi.useRealTimers();
});

const rec = (date: string | null, tags = "") => ({ date, tags });

describe("getRecordKpis", () => {
  it("沒填日期的不算完成", () => {
    freeze("2026-08-19T10:00:00");

    expect(getRecordKpis([rec("2026-03-01"), rec(null), rec("")]).completed).toBe(1);
  });

  it("今年筆數只算今年", () => {
    freeze("2026-08-19T10:00:00");

    expect(getRecordKpis([rec("2026-03-01"), rec("2025-12-31")]).thisYear).toBe(1);
  });

  it("月均是今年筆數除以已過的月份數", () => {
    freeze("2026-08-19T10:00:00"); // 第 8 個月

    expect(getRecordKpis([rec("2026-01-05"), rec("2026-02-05")]).avgPerMonth).toBe(0.3);
  });

  it("沒有資料就是零", () => {
    freeze("2026-08-19T10:00:00");

    expect(getRecordKpis([])).toEqual({ completed: 0, thisYear: 0, avgPerMonth: 0 });
  });

  it("日期帶時間也讀得到", () => {
    freeze("2026-08-19T10:00:00");

    expect(getRecordKpis([rec("2026-08-18 14:32")]).completed).toBe(1);
  });
});

describe("getRecordMonthlyTrend", () => {
  it("回傳連續的月份，沒有的補零", () => {
    freeze("2026-08-19T10:00:00");

    const trend = getRecordMonthlyTrend([rec("2026-07-01")], 3);

    expect(trend).toEqual([
      { month: "2026-06", count: 0 },
      { month: "2026-07", count: 1 },
      { month: "2026-08", count: 0 },
    ]);
  });

  it("同一個月會累加", () => {
    freeze("2026-08-19T10:00:00");

    const trend = getRecordMonthlyTrend([rec("2026-08-01"), rec("2026-08-31")], 1);

    expect(trend).toEqual([{ month: "2026-08", count: 2 }]);
  });

  it("超出視窗的月份不計入", () => {
    freeze("2026-08-19T10:00:00");

    expect(getRecordMonthlyTrend([rec("2025-01-01")], 3).every((m) => m.count === 0)).toBe(true);
  });

  it("跨年往回數", () => {
    freeze("2026-01-15T10:00:00");

    expect(getRecordMonthlyTrend([], 2).map((m) => m.month)).toEqual(["2025-12", "2026-01"]);
  });
});

describe("getFieldDistribution", () => {
  it("一格多值各算一次", () => {
    const slices = getFieldDistribution([rec("2026-08-01", "心理、歷史")], "tags");

    expect(slices).toEqual([
      { name: "心理", value: 1 },
      { name: "歷史", value: 1 },
    ]);
  });

  it("多的排前面", () => {
    const records = [
      rec("2026-08-01", "心理"),
      rec("2026-08-02", "心理"),
      rec("2026-08-03", "歷史"),
    ];

    expect(getFieldDistribution(records, "tags").map((s) => s.name)).toEqual(["心理", "歷史"]);
  });

  it("空白算未分類", () => {
    expect(getFieldDistribution([rec("2026-08-01", "")], "tags")).toEqual([
      { name: "未分類", value: 1 },
    ]);
  });

  it("includeBlank false 就整筆跳過", () => {
    const slices = getFieldDistribution([rec("2026-08-01", "")], "tags", { includeBlank: false });

    expect(slices).toEqual([]);
  });

  it("limit 只留前幾名", () => {
    const records = [rec("2026-08-01", "a"), rec("2026-08-02", "a"), rec("2026-08-03", "b")];

    expect(getFieldDistribution(records, "tags", { limit: 1 })).toEqual([{ name: "a", value: 2 }]);
  });

  it("沒填日期的不進分布", () => {
    expect(getFieldDistribution([rec(null, "心理")], "tags")).toEqual([]);
  });
});
