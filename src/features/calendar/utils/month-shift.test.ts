import { describe, expect, it } from "vitest";
import { isSameMonth, shiftMonth } from "./month-shift";

describe("shiftMonth", () => {
  it("一月往前是去年十二月", () => {
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
  });

  it("十二月往後是明年一月", () => {
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
  });

  it("年中照常加減", () => {
    expect(shiftMonth({ year: 2026, month: 5 }, 1)).toEqual({ year: 2026, month: 6 });
  });
});

describe("isSameMonth", () => {
  it("年月都同才算", () => {
    expect(isSameMonth({ year: 2026, month: 9 }, { year: 2026, month: 9 })).toBe(true);
    expect(isSameMonth({ year: 2025, month: 9 }, { year: 2026, month: 9 })).toBe(false);
  });
});
