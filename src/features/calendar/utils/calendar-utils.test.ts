import { describe, expect, it } from "vitest";
import { buildMonthGrid, type DatedEntry } from "./calendar-utils";

const entry = (date: string | null, id = date ?? "x"): DatedEntry => ({
  id,
  title: id,
  coverUrl: "",
  href: `/x/${id}`,
  kindSlug: "books",
  date,
});

/** 2026-09：1 號是星期二，30 天，所以跨 5 週 */
const SEP = [2026, 8] as const;

describe("buildMonthGrid", () => {
  it("只產出這個月跨到的週數", () => {
    expect(buildMonthGrid(...SEP, []).length).toBe(35);
    // 2026-02：1 號是星期日、28 天，剛好 4 週，尾端不該多出一整列灰格
    expect(buildMonthGrid(2026, 1, []).length).toBe(28);
  });

  it("前後補滿整週，補進來的標成不在當月", () => {
    const days = buildMonthGrid(...SEP, []);
    // 9/1 是星期二，所以格子從 8/30（星期日）起，前面補兩格
    expect(days[0].date.getDate()).toBe(30);
    expect(days[0].inCurrentMonth).toBe(false);
    expect(days[1].inCurrentMonth).toBe(false);
    expect(days[2].date.getDate()).toBe(1);
    expect(days[2].inCurrentMonth).toBe(true);
  });

  it("同一天的落在同一格，順序照傳進來的", () => {
    const days = buildMonthGrid(...SEP, [entry("2026-09-10", "a"), entry("2026-09-10", "b")]);
    const day = days.find((d) => d.date.getDate() === 10 && d.inCurrentMonth)!;
    expect(day.entries.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("沒有日期或日期壞掉的不進月曆", () => {
    const days = buildMonthGrid(...SEP, [entry(null, "a"), entry("好像不是日期", "b")]);
    expect(days.flatMap((d) => d.entries)).toEqual([]);
  });

  it("別的月份的不進這張月曆", () => {
    const days = buildMonthGrid(...SEP, [entry("2026-07-15", "a")]);
    expect(days.flatMap((d) => d.entries)).toEqual([]);
  });

  it("日期那一欄不跟著進格子——它是分堆用的，不是這一筆的內容", () => {
    const days = buildMonthGrid(...SEP, [entry("2026-09-10", "a")]);
    const found = days.flatMap((d) => d.entries)[0];
    expect(found).not.toHaveProperty("date");
    expect(found.title).toBe("a");
  });
});
