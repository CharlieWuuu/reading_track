import { afterEach, describe, expect, it, vi } from "vitest";
import { makeWriting, resetIds } from "@/testing/factories";
import { getTopicDistribution, getWritingKpis, getWritingMonthlyTrend } from "./writing-stats";

resetIds();

function freeze(local: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(local));
}

afterEach(() => {
  vi.useRealTimers();
});

describe("getWritingKpis", () => {
  it("沒填日期的不算", () => {
    freeze("2026-08-19T10:00:00");

    const kpis = getWritingKpis([makeWriting({ date: "2026-08-01" }), makeWriting({ date: "" })]);

    expect(kpis).toMatchObject({ completed: 1, thisYear: 1 });
  });

  it("帶時間的日期照樣算", () => {
    freeze("2026-08-19T10:00:00");

    expect(getWritingKpis([makeWriting({ date: "2026-08-18 14:32" })]).completed).toBe(1);
  });
});

describe("getWritingMonthlyTrend", () => {
  it("落到月份上，空月補零", () => {
    freeze("2026-08-19T10:00:00");

    expect(getWritingMonthlyTrend([makeWriting({ date: "2026-08-05" })], 2)).toEqual([
      { month: "2026-07", count: 0 },
      { month: "2026-08", count: 1 },
    ]);
  });
});

describe("getTopicDistribution", () => {
  it("依主題分布，多的排前面", () => {
    const writings = [
      makeWriting({ topic: "心得" }),
      makeWriting({ topic: "心得" }),
      makeWriting({ topic: "隨筆" }),
    ];

    expect(getTopicDistribution(writings)).toEqual([
      { name: "心得", value: 2 },
      { name: "隨筆", value: 1 },
    ]);
  });

  it("沒填主題的算未分類", () => {
    expect(getTopicDistribution([makeWriting({ topic: "" })])).toEqual([
      { name: "未分類", value: 1 },
    ]);
  });
});
