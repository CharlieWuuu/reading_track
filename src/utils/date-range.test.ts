import { describe, expect, it } from "vitest";
import { dayRange, itemsInRange, yearRange } from "@/utils/date-range";

describe("itemsInRange", () => {
  it("用 endDate 判斷", () => {
    const rows = [{ endDate: "2026-09-10", startDate: null, createdAt: "2026-01-01T00:00:00Z" }];
    expect(itemsInRange(rows, { start: "2026-09-01", end: "2026-09-30" })).toHaveLength(1);
  });

  it("endDate 優先於 startDate", () => {
    const rows = [
      { endDate: "2026-01-01", startDate: "2026-09-10", createdAt: "2026-09-10T00:00:00Z" },
    ];
    expect(itemsInRange(rows, { start: "2026-09-01", end: "2026-09-30" })).toHaveLength(0);
  });

  it("不在範圍內就排除", () => {
    const rows = [{ endDate: "2026-10-01", startDate: null, createdAt: "2026-01-01T00:00:00Z" }];
    expect(itemsInRange(rows, { start: "2026-09-01", end: "2026-09-30" })).toHaveLength(0);
  });
});

describe("yearRange", () => {
  it("涵蓋整年", () => {
    expect(yearRange(2026)).toEqual({ start: "2026-01-01", end: "2026-12-31" });
  });
});

describe("dayRange", () => {
  it("頭尾是同一天", () => {
    expect(dayRange("2026-09-10")).toEqual({ start: "2026-09-10", end: "2026-09-10" });
  });
});
