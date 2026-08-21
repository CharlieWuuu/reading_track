import { afterEach, describe, expect, it, vi } from "vitest";
import { makeJournal, resetIds } from "@/testing/factories";
import { getJournalKpis, getJournalMonthlyTrend, getKindDistribution } from "./journal-stats";

resetIds();

function freeze(local: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(local));
}

afterEach(() => {
  vi.useRealTimers();
});

describe("getJournalKpis", () => {
  it("沒填日期的不算", () => {
    freeze("2026-08-19T10:00:00");

    const kpis = getJournalKpis([makeJournal({ date: "2026-08-01" }), makeJournal({ date: "" })]);

    expect(kpis).toMatchObject({ completed: 1, thisYear: 1 });
  });

  it("帶時間的日期照樣算", () => {
    freeze("2026-08-19T10:00:00");

    expect(getJournalKpis([makeJournal({ date: "2026-08-18 14:32" })]).completed).toBe(1);
  });
});

describe("getJournalMonthlyTrend", () => {
  it("落到月份上，空月補零", () => {
    freeze("2026-08-19T10:00:00");

    expect(getJournalMonthlyTrend([makeJournal({ date: "2026-08-05" })], 2)).toEqual([
      { month: "2026-07", count: 0 },
      { month: "2026-08", count: 1 },
    ]);
  });
});

describe("getKindDistribution", () => {
  it("依類型分布，多的排前面", () => {
    const journal = [
      makeJournal({ kind: "書籍" }),
      makeJournal({ kind: "書籍" }),
      makeJournal({ kind: "影劇" }),
    ];

    expect(getKindDistribution(journal)).toEqual([
      { name: "書籍", value: 2 },
      { name: "影劇", value: 1 },
    ]);
  });

  it("沒填類型的算未分類", () => {
    expect(getKindDistribution([makeJournal({ kind: "" })])).toEqual([
      { name: "未分類", value: 1 },
    ]);
  });
});
