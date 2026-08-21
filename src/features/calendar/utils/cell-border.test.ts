import { describe, expect, it } from "vitest";
import { cellBorder } from "@/features/calendar/utils/cell-border";

const TOTAL = 35; // 五列

describe("cellBorder", () => {
  it("中間的格子右邊與下面都畫", () => {
    expect(cellBorder(8, TOTAL)).toBe("border-gray-100 border-r border-b");
  });

  it("最右一欄不畫右邊", () => {
    expect(cellBorder(6, TOTAL)).toBe("border-gray-100 border-b");
  });

  it("最後一列不畫下面", () => {
    expect(cellBorder(30, TOTAL)).toBe("border-gray-100 border-r");
  });

  it("右下角兩邊都不畫", () => {
    expect(cellBorder(TOTAL - 1, TOTAL)).toBe("border-gray-100");
  });

  it("六列時最後一列才算最後一列", () => {
    expect(cellBorder(30, 42)).toBe("border-gray-100 border-r border-b");
  });
});
