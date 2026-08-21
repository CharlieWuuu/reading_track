import { afterEach, describe, expect, it, vi } from "vitest";
import { makeEntry, resetIds } from "@/testing/factories";
import { getEntryKpis, getEntryMonthlyTrend, getKindDistribution } from "./entry-stats";

resetIds();

function freeze(local: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(local));
}

afterEach(() => {
  vi.useRealTimers();
});

describe("getEntryKpis", () => {
  it("沒填日期的不算", () => {
    freeze("2026-08-19T10:00:00");

    const kpis = getEntryKpis([makeEntry({ date: "2026-08-01" }), makeEntry({ date: "" })]);

    expect(kpis).toMatchObject({ completed: 1, thisYear: 1 });
  });

  it("帶時間的日期照樣算", () => {
    freeze("2026-08-19T10:00:00");

    expect(getEntryKpis([makeEntry({ date: "2026-08-18 14:32" })]).completed).toBe(1);
  });
});

describe("getEntryMonthlyTrend", () => {
  it("落到月份上，空月補零", () => {
    freeze("2026-08-19T10:00:00");

    expect(getEntryMonthlyTrend([makeEntry({ date: "2026-08-05" })], 2)).toEqual([
      { month: "2026-07", count: 0 },
      { month: "2026-08", count: 1 },
    ]);
  });
});

describe("getKindDistribution", () => {
  it("依類型分布，多的排前面", () => {
    const entries = [
      makeEntry({ kind: "書籍" }),
      makeEntry({ kind: "書籍" }),
      makeEntry({ kind: "影劇" }),
    ];

    expect(getKindDistribution(entries)).toEqual([
      { name: "書籍", value: 2 },
      { name: "影劇", value: 1 },
    ]);
  });

  it("沒填類型的算未分類", () => {
    expect(getKindDistribution([makeEntry({ kind: "" })])).toEqual([{ name: "未分類", value: 1 }]);
  });
});
