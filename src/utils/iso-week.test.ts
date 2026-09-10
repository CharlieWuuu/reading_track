import { describe, expect, it } from "vitest";
import {
  isInIsoWeek,
  isoWeekOf,
  isoWeekRange,
  nextIsoWeek,
  previousIsoWeek,
} from "@/utils/iso-week";

describe("isoWeekOf", () => {
  it("一般週間日期", () => {
    expect(isoWeekOf("2026-09-10")).toEqual({ year: 2026, week: 37 });
  });

  it("跨年：去年 12/31 落在今年第 1 週", () => {
    expect(isoWeekOf("2024-12-31")).toEqual({ year: 2025, week: 1 });
  });

  it("跨年：今年 1/1 落在去年最後一週", () => {
    expect(isoWeekOf("2023-01-01")).toEqual({ year: 2022, week: 52 });
  });
});

describe("isoWeekRange", () => {
  it("回傳週一到週日", () => {
    expect(isoWeekRange({ year: 2026, week: 37 })).toEqual({
      start: "2026-09-07",
      end: "2026-09-13",
    });
  });

  it("第 1 週可能從去年 12 月開始", () => {
    expect(isoWeekRange({ year: 2025, week: 1 })).toEqual({
      start: "2024-12-30",
      end: "2025-01-05",
    });
  });
});

describe("previousIsoWeek／nextIsoWeek", () => {
  it("往前一週", () => {
    expect(previousIsoWeek({ year: 2026, week: 37 })).toEqual({ year: 2026, week: 36 });
  });

  it("跨年往前", () => {
    expect(previousIsoWeek({ year: 2025, week: 1 })).toEqual({ year: 2024, week: 52 });
  });

  it("往後一週", () => {
    expect(nextIsoWeek({ year: 2026, week: 37 })).toEqual({ year: 2026, week: 38 });
  });

  it("跨年往後", () => {
    expect(nextIsoWeek({ year: 2024, week: 52 })).toEqual({ year: 2025, week: 1 });
  });
});

describe("isInIsoWeek", () => {
  it("週範圍內", () => {
    expect(isInIsoWeek("2026-09-10", { year: 2026, week: 37 })).toBe(true);
  });

  it("週範圍外", () => {
    expect(isInIsoWeek("2026-09-14", { year: 2026, week: 37 })).toBe(false);
  });
});
