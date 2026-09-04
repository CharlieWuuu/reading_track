import { describe, expect, it } from "vitest";
import { makeBook } from "@/testing/factories";
import { groupBooks } from "./group-books";

describe("groupBooks", () => {
  it("讀一次的書各自一組", () => {
    const groups = groupBooks([
      makeBook({ title: "挪威的森林" }),
      makeBook({ title: "海邊的卡夫卡" }),
    ]);
    expect(groups).toHaveLength(2);
  });

  it("originId 指回去的算同一本", () => {
    const first = makeBook({ id: "a", title: "挪威的森林", startDate: "2024-01-01" });
    const again = makeBook({
      id: "b",
      title: "挪威的森林",
      originId: "a",
      startDate: "2026-01-01",
    });
    const [group] = groupBooks([first, again]);

    expect(groupBooks([first, again])).toHaveLength(1);
    expect(group.rows).toHaveLength(2);
    expect(group.primary.id).toBe("a"); // 代表列是最早讀的那次
  });

  it("沒有 originId 但書名作者一樣，也算同一本", () => {
    const rows = [
      makeBook({ id: "a", title: "挪威的森林", author: "村上春樹" }),
      makeBook({ id: "b", title: "挪威的森林", author: "村上春樹" }),
    ];
    expect(groupBooks(rows)).toHaveLength(1);
  });

  it("副標不算書名的一部分：紙本與電子書常常只差這個", () => {
    const rows = [
      makeBook({ id: "a", title: "重構", author: "Martin Fowler" }),
      makeBook({ id: "b", title: "重構：改善既有程式的設計", author: "Martin Fowler" }),
    ];
    expect(groupBooks(rows)).toHaveLength(1);
  });

  it("同名不同作者是兩本書", () => {
    const rows = [
      makeBook({ id: "a", title: "小王子", author: "聖修伯里" }),
      makeBook({ id: "b", title: "小王子", author: "另一個人" }),
    ];
    expect(groupBooks(rows)).toHaveLength(2);
  });

  it("originId 指向不存在的列時，那一列自己成一組，不整組掉", () => {
    const orphan = makeBook({ id: "b", title: "失落的一列", originId: "不存在" });
    const [group] = groupBooks([orphan]);
    expect(group.rows).toEqual([orphan]);
  });

  it("每一列都只會出現在一組裡", () => {
    const rows = [
      makeBook({ id: "a", title: "挪威的森林", author: "村上春樹" }),
      makeBook({ id: "b", title: "挪威的森林", author: "村上春樹", originId: "a" }),
      makeBook({ id: "c", title: "海邊的卡夫卡", author: "村上春樹" }),
    ];
    const groups = groupBooks(rows);
    const ids = groups.flatMap((g) => g.rows.map((r) => r.id));
    expect(ids.toSorted()).toEqual(["a", "b", "c"]);
  });
});
