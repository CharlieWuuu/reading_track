import { describe, expect, it } from "vitest";
import { trimToBudget } from "./cache-budget";

const big = (chars: number) => "x".repeat(chars);

describe("trimToBudget", () => {
  it("進得了預算就原樣留著", () => {
    const entries: [string, string][] = [["a", "1"]];
    expect(trimToBudget(entries, 1000)).toEqual({ kept: entries, dropped: [] });
  });

  it("超過預算時從最大的開始丟", () => {
    const entries: [string, string][] = [
      ["small", big(10)],
      ["huge", big(1000)],
      ["medium", big(100)],
    ];
    const { kept, dropped } = trimToBudget(entries, 500);
    expect(dropped).toEqual(["huge"]);
    expect(kept.map(([k]) => k)).toEqual(["small", "medium"]);
  });

  it("丟到進得了預算為止，不是只丟一筆", () => {
    const entries: [string, string][] = [
      ["a", big(400)],
      ["b", big(400)],
      ["c", big(10)],
    ];
    const { kept } = trimToBudget(entries, 800);
    expect(kept.map(([k]) => k)).toEqual(["c"]);
  });

  it("原本的順序留著，不會被大小排序打亂", () => {
    const entries: [string, string][] = [
      ["a", big(10)],
      ["b", big(1000)],
      ["c", big(10)],
    ];
    expect(trimToBudget(entries, 100).kept.map(([k]) => k)).toEqual(["a", "c"]);
  });
});
