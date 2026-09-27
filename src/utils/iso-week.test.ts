import { describe, expect, it } from "vitest";
import { isoWeekOf } from "@/utils/iso-week";

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
