import { describe, expect, it } from "vitest";
import { makeBook } from "@/testing/factories";
import { readCount, rootId, sameBook } from "./book-reads";

describe("rootId", () => {
  it("第一次讀的那列就是自己", () => {
    const book = makeBook({ id: "a" });
    expect(rootId(book)).toBe("a");
  });

  it("重讀那列指回第一次", () => {
    expect(rootId(makeBook({ id: "b", originId: "a" }))).toBe("a");
  });
});

describe("sameBook", () => {
  const first = makeBook({ id: "a", title: "同一本" });
  const second = makeBook({ id: "b", originId: "a", title: "同一本" });
  const other = makeBook({ id: "c", title: "另一本" });
  const all = [first, second, other];

  it("從第一次那列找得到重讀那列", () => {
    expect(sameBook(all, first).map((b) => b.id)).toEqual(["a", "b"]);
  });

  it("從重讀那列也找得回來——兩邊都要成立", () => {
    expect(sameBook(all, second).map((b) => b.id)).toEqual(["a", "b"]);
  });

  it("沒重讀過就只有自己", () => {
    expect(sameBook(all, other).map((b) => b.id)).toEqual(["c"]);
  });

  it("書名一樣但沒有連結就不算同一本——靠編號不靠書名", () => {
    const sameTitle = makeBook({ id: "d", title: "同一本" });
    expect(sameBook([...all, sameTitle], first).map((b) => b.id)).toEqual(["a", "b"]);
  });
});

describe("readCount", () => {
  it("只算讀完的", () => {
    const first = makeBook({ id: "a", status: "已讀完" });
    const rereading = makeBook({ id: "b", originId: "a", status: "閱讀中", endDate: null });
    expect(readCount([first, rereading], first)).toBe(1);
  });
});
