import { describe, expect, it } from "vitest";
import {
  byYear,
  countMeta,
  doneNumbers,
  fragmentsNewestFirst,
  moduleKeysByKind,
  recordsNewestFirst,
  splitByStatus,
  statusOf,
  tileMeta,
} from "./kind-list";

describe("byYear", () => {
  const items = [
    { id: "a", endDate: "2026-09-02" },
    { id: "b", endDate: "2025-01-10" },
    { id: "c", endDate: null },
    { id: "d", endDate: "2026-08-30" },
  ];

  it("照年分段，新的在前，沒日期的排最後", () => {
    const groups = byYear(items, "未完成");
    expect(groups.map((g) => g.label)).toEqual(["2026", "2025", "未完成"]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["a", "d"]);
  });

  it("全部都有日期就沒有未完成那段", () => {
    expect(byYear(items.slice(0, 2), "未完成").map((g) => g.label)).toEqual(["2026", "2025"]);
  });
});

describe("countMeta", () => {
  const rows = [{ workId: "w1" }, { workId: "w1" }, { workId: "w2" }];

  it("不算重讀就是筆數", () => {
    expect(countMeta(rows, "本", false)).toBe("3 本");
  });

  it("算重讀而且真的有重讀", () => {
    expect(countMeta(rows, "本", true)).toBe("3 次・2 本");
  });

  it("算重讀但沒有重讀，只寫一個數字", () => {
    expect(countMeta(rows.slice(1), "本", true)).toBe("2 本");
  });
});

describe("doneNumbers", () => {
  it("最早完成的是 1，沒完成的沒號碼", () => {
    const numbers = doneNumbers([
      { id: "new", endDate: "2026-09-01" },
      { id: "open", endDate: null },
      { id: "old", endDate: "2024-01-01" },
    ]);
    expect(numbers.get("old")).toBe(1);
    expect(numbers.get("new")).toBe(2);
    expect(numbers.has("open")).toBe(false);
  });
});

describe("statusOf", () => {
  const keys = (...list: string[]) => new Set(list);

  it("兩個日期都勾：照日期推", () => {
    const both = keys("startDate", "endDate");
    expect(statusOf({ startDate: "2026-09-01", endDate: "2026-09-02" }, both)).toBe("done");
    expect(statusOf({ startDate: "2026-09-01", endDate: null }, both)).toBe("reading");
    expect(statusOf({ startDate: null, endDate: null }, both)).toBe("want");
  });

  it("沒勾開始日期：舊資料留著的開始日期不算，沒有進行中", () => {
    expect(statusOf({ startDate: "2026-09-01", endDate: null }, keys("endDate"))).toBe("want");
  });

  it("兩個日期都沒勾：記下就算完成", () => {
    expect(statusOf({ startDate: "2026-09-01", endDate: null }, keys("title"))).toBe("done");
  });

  it("查不到類型時照日期推", () => {
    expect(statusOf({ startDate: "2026-09-01", endDate: null })).toBe("reading");
  });
});

describe("splitByStatus", () => {
  it("每一筆照自己類型勾的日期拆", () => {
    const byKind = moduleKeysByKind([
      { id: "book", modules: [{ key: "startDate" }, { key: "endDate" }] },
      { id: "article", modules: [{ key: "endDate" }] },
    ]);
    const { active, pending, done } = splitByStatus(
      [
        { id: "reading-book", kindId: "book", startDate: "2026-09-01", endDate: null },
        { id: "old-article", kindId: "article", startDate: "2026-09-01", endDate: null },
        { id: "read-article", kindId: "article", startDate: null, endDate: "2026-09-02" },
      ],
      byKind,
    );
    expect([active, pending, done].map((list) => list.map((r) => r.id))).toEqual([
      ["reading-book"],
      ["old-article"],
      ["read-article"],
    ]);
  });
});

describe("recordsNewestFirst", () => {
  it("完成看完成日、進行看開始日，沒日期的排最後", () => {
    const rows = recordsNewestFirst([
      { id: "old", startDate: "2024-01-01", endDate: "2024-02-01", createdAt: "2026-09-01" },
      { id: "none", startDate: null, endDate: null, createdAt: "2026-09-27" },
      { id: "reading", startDate: "2026-09-10", endDate: null, createdAt: "2026-09-10" },
      { id: "done", startDate: "2026-08-01", endDate: "2026-09-02", createdAt: "2026-08-01" },
    ]);
    expect(rows.map((r) => r.id)).toEqual(["reading", "done", "old", "none"]);
  });

  it("同一天看誰後記", () => {
    const rows = recordsNewestFirst([
      { id: "a", endDate: "2026-09-02", createdAt: "2026-09-02T08:00" },
      { id: "b", endDate: "2026-09-02", createdAt: "2026-09-02T09:00" },
    ]);
    expect(rows.map((r) => r.id)).toEqual(["b", "a"]);
  });
});

describe("fragmentsNewestFirst", () => {
  it("照自己的日期，不照建立時間", () => {
    const rows = fragmentsNewestFirst([
      { id: "late-entry", date: "2025-01-01", createdAt: "2026-09-27" },
      { id: "recent", date: "2026-09-10", createdAt: "2026-09-10" },
    ]);
    expect(rows.map((r) => r.id)).toEqual(["recent", "late-entry"]);
  });
});

describe("tileMeta", () => {
  it("完成的寫日期，沒完成的寫狀態", () => {
    expect(tileMeta("2026-09-02", "done")).toBe("2026-09-02 完成");
    expect(tileMeta(null, "reading")).toBe("進行");
    expect(tileMeta(null, "want")).toBe("想要");
  });
});
