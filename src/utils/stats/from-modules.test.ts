import { describe, expect, it } from "vitest";
import { statsOfModules } from "./from-modules";

describe("statsOfModules", () => {
  it("沒有 stat 的模組不出圖", () => {
    const keys = statsOfModules(["title", "longText", "locator"]).map((s) => s.moduleKey);
    expect(keys).toEqual([]);
  });

  it("勾了什麼就出什麼圖", () => {
    const specs = statsOfModules(["creator", "language", "amount"]);
    expect(specs.map((s) => s.kind).sort()).toEqual(["distribution", "ranking", "sum"]);
  });

  it("領域是一個模組兩欄，但只出一張樹狀圖", () => {
    const [spec] = statsOfModules(["topic"]);
    expect(spec.kind).toBe("tree");
    expect(spec.fields).toEqual(["domain", "subDomain"]);
  });

  it("類型改過的名字蓋掉模組庫的預設", () => {
    const [spec] = statsOfModules(["creator"], { creator: "導演" });
    expect(spec.label).toBe("導演");
  });

  it("認不得的 key 忽略掉", () => {
    expect(statsOfModules(["亂寫"])).toEqual([]);
  });

  it("趨勢排在名次前面——先看整體再看細節", () => {
    const kinds = statsOfModules(["creator", "endDate"]).map((s) => s.kind);
    expect(kinds).toEqual(["trend", "ranking", "calendar"]);
  });
});

describe("月曆、數線、地圖、年代", () => {
  it("一個模組出好幾張：完成日既是趨勢也是月曆", () => {
    const kinds = statsOfModules(["endDate"]).map((s) => s.kind);
    expect(kinds).toEqual(["trend", "calendar"]);
  });

  it("數線要兩格日期都有——只有開始沒有完成，每條線都沒有盡頭", () => {
    expect(statsOfModules(["startDate"]).map((s) => s.kind)).not.toContain("timeline");
    expect(statsOfModules(["startDate", "endDate"]).map((s) => s.kind)).toContain("timeline");
  });

  it("座標給地圖、起訖年給年代", () => {
    const kinds = statsOfModules(["coordinates", "years"]).map((s) => s.kind);
    expect(kinds).toEqual(["era", "map"]);
  });

  it("佔整面的排在小圖後面", () => {
    const kinds = statsOfModules(["coordinates", "creator", "endDate"]).map((s) => s.kind);
    expect(kinds).toEqual(["trend", "ranking", "calendar", "map"]);
  });
});
