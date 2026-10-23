import { describe, expect, it } from "vitest";
import type { ExportEntry } from "@/utils/obsidian-export";
import { renderReadLog, renderStats } from "@/utils/obsidian-views";

const book = (id: string, reads: ExportEntry["reads"]): ExportEntry => ({
  id,
  kind: "書籍",
  folder: "01 紀錄/書籍",
  title: id,
  body: "",
  meta: {},
  tags: [],
  urls: [],
  reads,
});

describe("renderStats", () => {
  const books = [
    book("a", [{ start: "2025-01-01", end: "2025-02-01", platform: "Kobo" }]),
    book("b", [{ start: "2026-03-01", end: "2026-03-20", platform: "Kobo" }]),
    book("c", [{ start: "2026-10-01", end: null, platform: "讀墨" }]),
  ];
  const { content } = renderStats(books, "2026-10-23");

  it("總數、今年、閱讀中", () => {
    expect(content).toContain("書籍 **3** 本，讀完 **2** 次");
    expect(content).toContain("2026 年讀完 **1** 本");
    expect(content).toContain("## 閱讀中\n\n```base");
    expect(content).not.toContain("[[");
  });

  it("每年長條依年份排序，今年每月補零", () => {
    expect(content).toContain('x-axis ["2025", "2026"]');
    expect(content).toContain("bar [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]");
  });

  it("平台圓餅含閱讀中那次", () => {
    expect(content).toContain('"Kobo" : 2');
    expect(content).toContain('"讀墨" : 1');
  });

  it("閱讀紀錄是嵌入查詢，不寫連結", () => {
    const log = renderReadLog();
    expect(log.path).toBe("01 紀錄/閱讀紀錄.md");
    expect(log.content).toContain("```base");
    expect(log.content).not.toContain("[[");
  });
});
