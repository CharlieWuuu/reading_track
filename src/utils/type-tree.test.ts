import { describe, expect, it } from "vitest";
import { childrenByDomain, scopedOptions } from "./type-tree";

describe("childrenByDomain", () => {
  it("把紀錄配對成領域與它底下的次領域", () => {
    const map = childrenByDomain([
      { domain: "人文社科", subDomain: "歷史" },
      { domain: "人文社科", subDomain: "政治" },
      { domain: "文學", subDomain: "中國文學" },
    ]);

    expect(map.get("人文社科")).toEqual(["政治", "歷史"]);
    expect(map.get("文學")).toEqual(["中國文學"]);
  });

  it("同一組出現多次只算一個", () => {
    const map = childrenByDomain([
      { domain: "文學", subDomain: "日本文學" },
      { domain: "文學", subDomain: "日本文學" },
    ]);

    expect(map.get("文學")).toEqual(["日本文學"]);
  });

  it("只填領域的紀錄留下空清單", () => {
    const map = childrenByDomain([{ domain: "語言學習", subDomain: "" }]);

    expect(map.get("語言學習")).toEqual([]);
  });

  it("頓號串起來的舊資料每一個都算", () => {
    const map = childrenByDomain([{ domain: "文學、程式", subDomain: "前端" }]);

    expect(map.get("文學")).toEqual(["前端"]);
    expect(map.get("程式")).toEqual(["前端"]);
  });
});

describe("scopedOptions", () => {
  const options = ["歷史", "政治", "理財", "前端"];

  it("父領域有子項就只留它底下的，順序照原本的", () => {
    expect(scopedOptions(options, ["政治", "歷史"], "")).toEqual(["歷史", "政治"]);
  });

  it("父領域沒選或沒有子項就列全部", () => {
    expect(scopedOptions(options, undefined, "")).toEqual(options);
    expect(scopedOptions(options, [], "")).toEqual(options);
  });

  it("目前已選的值就算不屬於這個領域也留著", () => {
    expect(scopedOptions(options, ["歷史"], "理財")).toEqual(["歷史", "理財"]);
  });
});
