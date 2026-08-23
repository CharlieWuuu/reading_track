import { beforeEach, describe, expect, it } from "vitest";
import { makeWriting, resetIds } from "@/testing/factories";
import { notesForKeyword, notesForSource } from "./related-notes";

beforeEach(resetIds);

describe("notesForSource", () => {
  it("重讀的兩列是兩個編號，心得要一起看得到", () => {
    const writings = [
      makeWriting({ sourceId: "book-1", date: "2026-01-01" }),
      makeWriting({ sourceId: "book-2", date: "2026-05-01" }),
      makeWriting({ sourceId: "book-9", date: "2026-06-01" }),
    ];
    expect(notesForSource(writings, ["book-1", "book-2"])).toHaveLength(2);
  });

  it("由新到舊，沒有日期的排最後", () => {
    const writings = [
      makeWriting({ sourceId: "b", date: null, title: "沒日期" }),
      makeWriting({ sourceId: "b", date: "2026-01-01", title: "舊" }),
      makeWriting({ sourceId: "b", date: "2026-08-01", title: "新" }),
    ];
    expect(notesForSource(writings, ["b"]).map((w) => w.title)).toEqual(["新", "舊", "沒日期"]);
  });

  it("沒有編號就不比對，空字串不會把沒來源的紀事全撈進來", () => {
    const writings = [makeWriting({ sourceId: "" })];
    expect(notesForSource(writings, [""])).toEqual([]);
  });
});

describe("notesForKeyword", () => {
  it("關鍵字一行一個，不是頓號分隔", () => {
    const writings = [
      makeWriting({ keywords: "正念\n冥想", title: "命中" }),
      makeWriting({ keywords: "正念、冥想", title: "整段當一個字，不算命中" }),
    ];
    expect(notesForKeyword(writings, "正念").map((w) => w.title)).toEqual(["命中"]);
  });

  it("空字串不撈東西", () => {
    expect(notesForKeyword([makeWriting({ keywords: "正念" })], "  ")).toEqual([]);
  });
});
