import { describe, expect, it } from "vitest";
import { Book } from "@/types/book";
import { byMonth, pickHeadline } from "./book-overview";

const book = (over: Partial<Book>): Book => ({ id: "1", title: "書", ...over }) as Book;

describe("byMonth", () => {
  it("照完成月份分組，順序照傳進來的清單", () => {
    const groups = byMonth([
      book({ id: "a", endDate: "2025-08-28" }),
      book({ id: "b", endDate: "2025-08-11" }),
      book({ id: "c", endDate: "2025-07-30" }),
    ]);
    expect(groups.map((g) => g.label)).toEqual(["2025 · 08", "2025 · 07"]);
    expect(groups[0].books.map((b) => b.id)).toEqual(["a", "b"]);
  });

  it("沒有完成日的自成一組", () => {
    const groups = byMonth([
      book({ id: "a", endDate: null }),
      book({ id: "b", endDate: "2025-08-01" }),
    ]);
    expect(groups.map((g) => g.label)).toEqual(["沒寫日期", "2025 · 08"]);
  });
});

describe("pickHeadline", () => {
  it("挑最近開始讀的那一本", () => {
    const pick = pickHeadline([
      book({ id: "a", startDate: "2025-07-02" }),
      book({ id: "b", startDate: "2025-08-20" }),
    ]);
    expect(pick?.id).toBe("b");
  });

  it("沒有在讀的書就沒有頭條", () => {
    expect(pickHeadline([])).toBeUndefined();
  });
});
