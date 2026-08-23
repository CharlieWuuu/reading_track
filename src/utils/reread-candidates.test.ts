import { beforeEach, describe, expect, it } from "vitest";
import { makeBook, resetIds } from "@/testing/factories";
import { findRereadGroups, toOriginPatches } from "./reread-candidates";

beforeEach(resetIds);

describe("findRereadGroups", () => {
  it("只有一列的書不算重讀", () => {
    expect(findRereadGroups([makeBook({ title: "深度工作力" })])).toEqual([]);
  });

  it("最舊那一列當源頭", () => {
    const groups = findRereadGroups([
      makeBook({ id: "new", title: "深度工作力", startDate: "2026-01-01" }),
      makeBook({ id: "old", title: "深度工作力", startDate: "2024-01-01" }),
    ]);
    expect(groups[0].origin.id).toBe("old");
    expect(groups[0].others.map((b) => b.id)).toEqual(["new"]);
  });

  it("沒有日期的不搶著當源頭", () => {
    const groups = findRereadGroups([
      makeBook({ id: "undated", title: "書", startDate: null, endDate: null }),
      makeBook({ id: "dated", title: "書", startDate: "2024-01-01" }),
    ]);
    expect(groups[0].origin.id).toBe("dated");
  });

  it("ISBN 對上就不再用書名猜一次", () => {
    const groups = findRereadGroups([
      makeBook({ title: "書名 A", isbn: "9789863594123", startDate: "2024-01-01" }),
      makeBook({ title: "書名 B", isbn: "9789863594123", startDate: "2026-01-01" }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].signal).toBe("isbn");
  });

  it("書名加作者比只有書名可信，同一本只進可信度高的那一組", () => {
    const groups = findRereadGroups([
      makeBook({ title: "同名", author: "甲", startDate: "2024-01-01" }),
      makeBook({ title: "同名", author: "甲", startDate: "2025-01-01" }),
      makeBook({ title: "同名", author: "乙", startDate: "2026-01-01" }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].signal).toBe("titleAuthor");
    expect(groups[0].others).toHaveLength(1);
  });

  it("空白與標點的差異不該讓同一本書變成兩本", () => {
    const groups = findRereadGroups([
      makeBook({ title: "深度工作力：淺薄時代", startDate: "2024-01-01" }),
      makeBook({ title: "深度工作力 淺薄時代", startDate: "2026-01-01" }),
    ]);
    expect(groups).toHaveLength(1);
  });

  it("已經連好的列不再參與：那代表人判斷過了", () => {
    expect(
      findRereadGroups([
        makeBook({ id: "a", title: "書" }),
        makeBook({ id: "b", title: "書", originId: "a" }),
      ]),
    ).toEqual([]);
  });

  it("沒有書名的列跳過，不會全部湊成一組", () => {
    expect(findRereadGroups([makeBook({ title: "" }), makeBook({ title: "  " })])).toEqual([]);
  });
});

describe("toOriginPatches", () => {
  it("每一列指向它那一組的源頭，源頭自己不用改", () => {
    const groups = findRereadGroups([
      makeBook({ id: "old", title: "書", startDate: "2024-01-01" }),
      makeBook({ id: "new", title: "書", startDate: "2026-01-01" }),
    ]);
    const patches = toOriginPatches(groups);
    expect(patches.get("new")).toEqual({ originId: "old" });
    expect(patches.has("old")).toBe(false);
  });
});
