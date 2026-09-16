import { describe, expect, it } from "vitest";
import { statsOfModules } from "./from-modules";
import { distribution, ranking, statData, sum, tree } from "./generic-stats";

const rows = [
  { creator: "村上春樹", language: "日文", domain: "文學", subDomain: "小說", amount: "300" },
  { creator: "村上春樹", language: "日文", domain: "文學", subDomain: "小說", amount: "250" },
  { creator: "卡繆", language: "中文", domain: "文學", subDomain: "", amount: "180" },
  { creator: "", language: "", domain: "", subDomain: "", amount: "" },
];

describe("ranking", () => {
  it("照次數排，空白不佔名次", () => {
    expect(ranking(rows, "creator")).toEqual([
      { name: "村上春樹", value: 2 },
      { name: "卡繆", value: 1 },
    ]);
  });

  it("一格多個值各算一次", () => {
    expect(ranking([{ tags: "程式、設計" }, { tags: "程式" }], "tags")[0]).toEqual({
      name: "程式",
      value: 2,
    });
  });
});

describe("distribution", () => {
  it("空白算「未分類」——有多少還沒分類本身是資訊", () => {
    const slices = distribution(rows, "language");
    expect(slices).toContainEqual({ name: "未分類", value: 1 });
    expect(slices[0]).toEqual({ name: "日文", value: 2 });
  });
});

describe("tree", () => {
  it("只填父層的歸在它自己底下的「其他」，不丟掉", () => {
    const groups = tree(rows, "domain", "subDomain");
    const literature = groups.find((g) => g.name === "文學")!;
    expect(literature.children).toEqual([
      { name: "小說", value: 2 },
      { name: "其他", value: 1 },
    ]);
  });
});

describe("sum", () => {
  it("空白不算進分母", () => {
    expect(sum(rows, "amount")).toEqual({ total: 730, average: 243 });
  });

  it("千分位逗號照樣算得出來", () => {
    expect(sum([{ amount: "1,200" }], "amount").total).toBe(1200);
  });

  it("全部空白給 0，不是 NaN", () => {
    expect(sum([{ amount: "" }], "amount")).toEqual({ total: 0, average: 0 });
  });
});

describe("statData", () => {
  it("勾什麼模組就算什麼圖", () => {
    const data = statData(statsOfModules(["creator", "topic", "amount"]), rows);
    expect(data.map((d) => d.kind)).toEqual(["sum", "tree", "ranking"]);
  });
});
