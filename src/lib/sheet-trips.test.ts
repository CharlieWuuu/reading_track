import { afterEach, describe, expect, it, vi } from "vitest";
import { resetTrips, trip, tripsInLastMinute } from "./sheet-trips";

afterEach(() => {
  resetTrips();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("sheet-trips", () => {
  it("每包一次就多算一趟", async () => {
    await trip(async () => "a");
    await trip(async () => "b");
    expect(tripsInLastMinute()).toBe(2);
  });

  it("原本的回傳值不受影響", async () => {
    await expect(trip(async () => 42)).resolves.toBe(42);
  });

  it("失敗照樣往外丟", async () => {
    await expect(
      trip(async () => {
        throw new Error("Sheet 壞了");
      }),
    ).rejects.toThrow("Sheet 壞了");
  });

  it("超過一分鐘的就不算了", async () => {
    vi.useFakeTimers();
    await trip(async () => "舊的");
    vi.advanceTimersByTime(61_000);
    await trip(async () => "新的");
    expect(tripsInLastMinute()).toBe(1);
  });

  it("到門檻才警告，而且只警告一次", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (let i = 0; i < 45; i++) await trip(async () => i);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("40");
  });
});
