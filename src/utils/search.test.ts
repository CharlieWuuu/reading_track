import { describe, expect, it } from "vitest";
import { matchesSearch, searchTerms } from "./search";

describe("searchTerms", () => {
  it("空白切詞、轉小寫", () => {
    expect(searchTerms("Deep Work")).toEqual(["deep", "work"]);
  });

  it("多餘空白不會變成空詞", () => {
    expect(searchTerms("  deep   work  ")).toEqual(["deep", "work"]);
  });

  it("空字串沒有詞", () => {
    expect(searchTerms("")).toEqual([]);
  });
});

describe("matchesSearch", () => {
  it("沒有詞就全部通過", () => {
    expect(matchesSearch([], "任何東西")).toBe(true);
  });

  it("多個詞之間是 AND", () => {
    expect(matchesSearch(["deep", "work"], "Deep Work")).toBe(true);
    expect(matchesSearch(["deep", "play"], "Deep Work")).toBe(false);
  });

  it("詞可以散在不同欄", () => {
    expect(matchesSearch(["deep", "cal"], "Deep Work", "Cal Newport")).toBe(true);
  });

  it("比對不分大小寫", () => {
    expect(matchesSearch(["newport"], "Cal NEWPORT")).toBe(true);
  });

  it("空欄位不會炸也不會亂配", () => {
    expect(matchesSearch(["deep"], null, undefined, "")).toBe(false);
  });

  it("跨欄相連的字串不算命中", () => {
    // 欄位之間補了空白，「workcal」不該被拼出來
    expect(matchesSearch(["workcal"], "Deep Work", "Cal Newport")).toBe(false);
  });
});
