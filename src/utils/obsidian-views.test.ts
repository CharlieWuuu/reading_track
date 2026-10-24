import { describe, expect, it } from "vitest";
import type { ExportEntry } from "@/utils/obsidian-export";
import { kindBase, renderKindStats, renderStats } from "@/utils/obsidian-views";

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
});

describe("kindBase", () => {
  it("base 放層資料夾、篩資料夾裡的頁面，有圖才加卡片圖", () => {
    const withImage = kindBase("99 資料/02 片段/關鍵字", { image: true, map: true });
    expect(withImage.path).toBe("02 片段/關鍵字.base");
    expect(withImage.content).toContain('file.inFolder("99 資料/02 片段/關鍵字")');
    expect(withImage.content).toContain("image: note.cover");
    expect(kindBase("99 資料/02 片段/單字", { image: false }).content).not.toContain("image:");
    expect(withImage.content).not.toContain("      - pronunciation");
    expect(withImage.content).toContain("type: map");
    expect(withImage.content).toContain("displayName: 摘要");
    expect(kindBase("99 資料/02 片段/單字", { image: false }).content).not.toContain("type: map");
    expect(kindBase("99 資料/02 片段/單字", { image: false }).content).toContain(
      "      - pronunciation",
    );
  });
});

describe("renderKindStats", () => {
  it("統計頁跟 base 同一層，交給 Dataview 即時畫；作品用讀完日期", () => {
    const { path, content } = renderKindStats("99 資料/01 紀錄/書籍");
    expect(path).toBe("01 紀錄/書籍統計.md");
    expect(content).toContain('"folder":"99 資料/01 紀錄/書籍","work":true');
    expect(renderKindStats("99 資料/03 書寫/思緒").content).toContain('"work":false');
  });
});
