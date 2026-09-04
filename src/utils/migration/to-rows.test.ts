import { describe, expect, it } from "vitest";
import { makeBook, makeWriting } from "@/testing/factories";
import { groupBooks } from "./group-books";
import {
  distinctValues,
  isSourceKind,
  toBookAndReadings,
  toInt,
  toWriting,
  typeNodes,
} from "./to-rows";

describe("typeNodes", () => {
  it("父節點排在子節點前面，插入時才找得到 parent", () => {
    const nodes = typeNodes([{ domain: "文學", subDomain: "日本文學" }]);
    expect(nodes).toEqual([
      { name: "文學", parent: null },
      { name: "日本文學", parent: "文學" },
    ]);
  });

  it("沒填次領域就只有父節點", () => {
    expect(typeNodes([{ domain: "語言學習", subDomain: "" }])).toEqual([
      { name: "語言學習", parent: null },
    ]);
  });

  it("沒填領域的整列跳過", () => {
    expect(typeNodes([{ domain: "", subDomain: "" }])).toEqual([]);
  });

  it("同一個領域出現很多次只建一個節點", () => {
    const nodes = typeNodes([
      { domain: "文學", subDomain: "日本文學" },
      { domain: "文學", subDomain: "西方文學" },
    ]);
    expect(nodes.filter((n) => n.name === "文學")).toHaveLength(1);
  });
});

describe("toInt", () => {
  it("字串轉數字", () => expect(toInt("320")).toBe(320));
  it("帶逗號的字數也讀得到", () => expect(toInt("62,000")).toBe(62000));
  it("不是數字就當沒填", () => expect(toInt("三百")).toBeNull());
  it("空的就是 null", () => expect(toInt("")).toBeNull());
});

describe("distinctValues", () => {
  it("去重、去空白、排序", () => {
    expect(distinctValues([" 東京 ", "東京", "", "京都"])).toEqual(["京都", "東京"]);
  });
});

describe("toBookAndReadings", () => {
  it("一組攤成一列書與多列閱讀", () => {
    const [group] = groupBooks([
      makeBook({ id: "a", title: "挪威的森林", startDate: "2024-01-01", pageCount: "440" }),
      makeBook({ id: "b", title: "挪威的森林", originId: "a", startDate: "2026-01-01" }),
    ]);
    const { book, readings } = toBookAndReadings(group);

    expect(book.title).toBe("挪威的森林");
    expect(readings).toHaveLength(2);
    expect(readings[0].pageCount).toBe(440);
  });

  it("類型掛在最細的那一層", () => {
    const [group] = groupBooks([makeBook({ domain: "文學", subDomain: "日本文學" })]);
    expect(toBookAndReadings(group).book.typeName).toBe("日本文學");
  });

  it("沒有次領域就掛領域", () => {
    const [group] = groupBooks([makeBook({ domain: "語言學習", subDomain: "" })]);
    expect(toBookAndReadings(group).book.typeName).toBe("語言學習");
  });

  it("關鍵字從整組收集，不是只看代表列", () => {
    const [group] = groupBooks([
      makeBook({ id: "a", title: "同一本", keywords: "東京" }),
      makeBook({ id: "b", title: "同一本", originId: "a", keywords: "京都" }),
    ]);
    expect(toBookAndReadings(group).book.keywords).toEqual(["京都", "東京"]);
  });

  it("私人的「是」變成 boolean", () => {
    const [group] = groupBooks([makeBook({ private: "是" })]);
    expect(toBookAndReadings(group).readings[0].isPrivate).toBe(true);
  });
});

describe("toWriting", () => {
  it("「書籍」「文章」是出處不是類型，留空給外鍵記", () => {
    expect(isSourceKind("書籍")).toBe(true);
    expect(toWriting(makeWriting({ kind: "書籍", sourceId: "abc" })).typeName).toBe("");
  });

  it("沒出處的那些，類型欄記的才是真的類型", () => {
    expect(toWriting(makeWriting({ kind: "思緒" })).typeName).toBe("思緒");
  });
});
