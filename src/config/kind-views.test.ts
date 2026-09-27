import { describe, expect, it } from "vitest";
import { fromKindViews, toKindViews, viewsOfKind, viewStates } from "./kind-views";

describe("viewsOfKind", () => {
  it("概覽一定有；卡片看封面圖、統計看能畫圖的模組、表格看有沒有勾", () => {
    expect(viewsOfKind(["overview", "table"], ["title", "cover", "endDate"])).toEqual([
      "overview",
      "card",
      "table",
      "stats",
    ]);
    expect(viewsOfKind(["overview"], ["title", "longText"])).toEqual(["overview"]);
  });
});

describe("viewStates", () => {
  it("只有表格能手動改", () => {
    const locked = viewStates(["overview"], ["title"]).filter((v) => !v.locked);
    expect(locked.map((v) => v.key)).toEqual(["table"]);
  });
});

describe("toKindViews／fromKindViews", () => {
  it("只存表格，舊資料存的卡片與統計丟掉", () => {
    expect(toKindViews("overview,card,stats")).toEqual(["overview"]);
    expect(toKindViews("overview,card,table,stats")).toEqual(["overview", "table"]);
    expect(fromKindViews(["overview", "card", "table"])).toBe("overview,table");
  });
});
