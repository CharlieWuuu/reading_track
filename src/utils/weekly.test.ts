import { describe, expect, it } from "vitest";
import { itemsInWeek } from "@/utils/weekly";

const week = { year: 2026, week: 37 }; // 2026-09-07 ~ 2026-09-13

describe("itemsInWeek", () => {
  it("用 endDate 判斷", () => {
    const rows = [{ endDate: "2026-09-10", startDate: null, createdAt: "2026-01-01T00:00:00Z" }];
    expect(itemsInWeek(rows, week)).toHaveLength(1);
  });

  it("沒有 endDate 時用 startDate", () => {
    const rows = [{ endDate: null, startDate: "2026-09-10", createdAt: "2026-01-01T00:00:00Z" }];
    expect(itemsInWeek(rows, week)).toHaveLength(1);
  });

  it("都沒有時用 createdAt", () => {
    const rows = [{ endDate: null, startDate: null, createdAt: "2026-09-10T08:00:00Z" }];
    expect(itemsInWeek(rows, week)).toHaveLength(1);
  });

  it("endDate 優先於 startDate", () => {
    const rows = [
      { endDate: "2026-01-01", startDate: "2026-09-10", createdAt: "2026-09-10T00:00:00Z" },
    ];
    expect(itemsInWeek(rows, week)).toHaveLength(0);
  });

  it("不在週範圍內就排除", () => {
    const rows = [{ endDate: "2026-09-20", startDate: null, createdAt: "2026-01-01T00:00:00Z" }];
    expect(itemsInWeek(rows, week)).toHaveLength(0);
  });
});
