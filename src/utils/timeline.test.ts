import { beforeEach, describe, expect, it } from "vitest";
import { makeBook, resetIds } from "@/testing/factories";
import { monthTicks, packLanes, spanRange, toSpans } from "./timeline";

const TODAY = new Date(2026, 7, 23); // 2026-08-23

beforeEach(resetIds);

describe("toSpans", () => {
  it("兩個日期都沒有的畫不出期間", () => {
    expect(toSpans([makeBook({ startDate: null, endDate: null })], TODAY)).toHaveLength(0);
  });

  it("只有完成日期就是那一天的一個點", () => {
    const [span] = toSpans([makeBook({ startDate: null, endDate: "2026-08-10" })], TODAY);
    expect(span.start).toEqual(span.end);
    expect(span.ongoing).toBe(false);
  });

  it("還在讀的畫到今天，而且標成未完成", () => {
    const [span] = toSpans([makeBook({ startDate: "2026-08-01", endDate: null })], TODAY);
    expect(span.end).toEqual(TODAY);
    expect(span.ongoing).toBe(true);
  });

  it("完成早於開始的壞資料收成一天，不畫負寬度", () => {
    const [span] = toSpans([makeBook({ startDate: "2026-08-10", endDate: "2026-08-01" })], TODAY);
    expect(span.start).toEqual(span.end);
  });
});

describe("packLanes", () => {
  it("不重疊的期間排進同一列", () => {
    const spans = toSpans(
      [
        makeBook({ startDate: "2026-01-01", endDate: "2026-01-10" }),
        makeBook({ startDate: "2026-03-01", endDate: "2026-03-10" }),
      ],
      TODAY,
    );
    expect(packLanes(spans)).toHaveLength(1);
  });

  it("重疊的期間各佔一列", () => {
    const spans = toSpans(
      [
        makeBook({ startDate: "2026-01-01", endDate: "2026-02-01" }),
        makeBook({ startDate: "2026-01-15", endDate: "2026-02-15" }),
      ],
      TODAY,
    );
    expect(packLanes(spans)).toHaveLength(2);
  });

  it("padDays 把靠太近的兩段推開，書名才不會擠在一起", () => {
    const spans = toSpans(
      [
        makeBook({ startDate: "2026-01-01", endDate: "2026-01-10" }),
        makeBook({ startDate: "2026-01-12", endDate: "2026-01-20" }),
      ],
      TODAY,
    );
    expect(packLanes(spans)).toHaveLength(1);
    expect(packLanes(spans, 7)).toHaveLength(2);
  });

  it("長的排在最上面那一列", () => {
    const spans = toSpans(
      [
        makeBook({ title: "短", startDate: "2026-01-01", endDate: "2026-01-05" }),
        makeBook({ title: "長", startDate: "2026-01-01", endDate: "2026-06-01" }),
      ],
      TODAY,
    );
    expect(packLanes(spans)[0][0].book.title).toBe("長");
  });
});

describe("spanRange", () => {
  it("沒有期間時回 null", () => {
    expect(spanRange([])).toBeNull();
  });

  it("涵蓋最早的開始到最晚的結束", () => {
    const spans = toSpans(
      [
        makeBook({ startDate: "2026-03-01", endDate: "2026-03-10" }),
        makeBook({ startDate: "2026-01-05", endDate: "2026-05-20" }),
      ],
      TODAY,
    );
    expect(spanRange(spans)).toEqual({ from: new Date(2026, 0, 5), to: new Date(2026, 4, 20) });
  });
});

describe("monthTicks", () => {
  it("頭尾只算落在範圍內的天數", () => {
    const ticks = monthTicks(new Date(2026, 0, 20), new Date(2026, 2, 5));
    expect(ticks.map((t) => [t.label, t.offset, t.days])).toEqual([
      ["1 月", 0, 12],
      ["2 月", 12, 28],
      ["3 月", 40, 5],
    ]);
  });

  it("只有第一格與每年一月寫年份", () => {
    const ticks = monthTicks(new Date(2025, 10, 1), new Date(2026, 1, 1));
    expect(ticks.map((t) => t.year)).toEqual([2025, null, 2026, null]);
  });
});
