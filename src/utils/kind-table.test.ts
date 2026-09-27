import { describe, expect, it } from "vitest";
import { cellOf, tableColumns } from "./kind-table";

describe("tableColumns", () => {
  it("照勾的順序，放不進一格的丟掉", () => {
    const columns = tableColumns([
      { key: "title", label: "標題" },
      { key: "longText", label: "內文" },
      { key: "cover", label: "封面圖" },
      { key: "creator", label: "作者" },
    ]);
    expect(columns.map((c) => c.key)).toEqual(["title", "creator"]);
  });
});

describe("cellOf", () => {
  it("片段沒有標題就用內文", () => {
    expect(cellOf({ title: "", body: "一句話" }, "title")).toBe("一句話");
  });

  it("片段的完成日是它自己的日期", () => {
    expect(cellOf({ date: "2026-09-10" }, "endDate")).toBe("2026-09-10");
  });

  it("量接上單位，沒有就空白", () => {
    expect(cellOf({ amount: 391, amountUnit: "頁" }, "amount")).toBe("391 頁");
    expect(cellOf({ amount: null }, "amount")).toBe("");
  });

  it("領域接次領域", () => {
    expect(cellOf({ domain: "程式", subDomain: "軟體工程" }, "topic")).toBe("程式 / 軟體工程");
  });

  it("認不得的欄位是空的", () => {
    expect(cellOf({ title: "x" }, "cover")).toBe("");
  });
});
