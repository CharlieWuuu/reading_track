import { describe, expect, it } from "vitest";
import { itemsInRange, monthRange } from "@/utils/date-range";

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

describe("monthRange", () => {
  it("框住那一天所在的整個月", () => {
    expect(monthRange("2026-02-14")).toEqual({ start: "2026-02-01", end: "2026-02-31" });
  });

  it("月底那天算進去，下個月一號不算", () => {
    const rows = [
      { endDate: "2026-02-28", createdAt: "2026-01-01T00:00:00Z" },
      { endDate: "2026-03-01", createdAt: "2026-01-01T00:00:00Z" },
    ];
    expect(itemsInRange(rows, monthRange("2026-02-14"))).toEqual([rows[0]]);
  });
});
