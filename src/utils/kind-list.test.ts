import { describe, expect, it } from "vitest";
import { byPeriod, countMeta, doneNumbers, splitByStatus } from "./kind-list";

describe("byPeriod", () => {
  const items = [
    { id: "a", endDate: "2026-09-02" },
    { id: "b", endDate: "2025-01-10" },
    { id: "c", endDate: null },
    { id: "d", endDate: "2026-08-30" },
  ];

  it("照年分段，新的在前，沒日期的排最後", () => {
    const groups = byPeriod(items, "year", "未完成");
    expect(groups.map((g) => g.label)).toEqual(["2026", "2025", "未完成"]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["a", "d"]);
  });

  it("照月分段", () => {
    expect(byPeriod(items, "month", "未完成").map((g) => g.label)).toEqual([
      "2026 · 09",
      "2026 · 08",
      "2025 · 01",
      "未完成",
    ]);
  });

  it("全部都有日期就沒有未完成那段", () => {
    expect(byPeriod(items.slice(0, 2), "year", "未完成").map((g) => g.label)).toEqual([
      "2026",
      "2025",
    ]);
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

describe("splitByStatus", () => {
  it("拆成進行、想要、完成", () => {
    const { active, pending, done } = splitByStatus([
      { id: "1", statusKey: "reading" },
      { id: "2", statusKey: "want" },
      { id: "3", statusKey: "done" },
    ]);
    expect([active, pending, done].map((list) => list.map((r) => r.id))).toEqual([
      ["1"],
      ["2"],
      ["3"],
    ]);
  });
});
