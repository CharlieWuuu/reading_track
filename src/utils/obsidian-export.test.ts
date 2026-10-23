import { describe, expect, it } from "vitest";
import { assignNames, buildFiles, type ExportEntry } from "@/utils/obsidian-export";

const entry = (over: Partial<ExportEntry>): ExportEntry => ({
  id: "00000000-0000-0000-0000-000000000000",
  kind: "書籍",
  title: "",
  body: "",
  meta: {},
  tags: [],
  urls: [],
  reads: [],
  ...over,
});

describe("assignNames", () => {
  it("非法字元換成空白、截長", () => {
    const names = assignNames([
      entry({ id: "a", kind: "佳句", title: "a/b:c?" + "長".repeat(50) }),
    ]);
    expect(names.get("a")).toBe("佳句/a b c " + "長".repeat(34));
  });

  it("同類型撞名補 id 前六碼，不同類型不算撞", () => {
    const names = assignNames([
      entry({ id: "aaaaaa-1", title: "同名" }),
      entry({ id: "bbbbbb-2", title: "同名" }),
      entry({ id: "cccccc-3", kind: "關鍵字", title: "同名" }),
    ]);
    expect([...names.values()]).toEqual([
      "書籍/同名 (aaaaaa)",
      "書籍/同名 (bbbbbb)",
      "關鍵字/同名",
    ]);
  });
});

describe("buildFiles", () => {
  const book = entry({
    id: "book",
    title: "一九八四",
    meta: { creator: "喬治・歐威爾", publisher: "", private: true },
    reads: [{ start: "2026-10-04", end: null, platform: "讀墨" }],
  });
  const word = entry({ id: "word", kind: "單字", title: "doublethink" });

  it("frontmatter 略過空值，閱讀紀錄與雙向連結都寫出來", () => {
    const files = buildFiles([book, word], [["word", "book"]]);
    const [b, w] = files.map((f) => f.content);
    expect(files[0].path).toBe("書籍/一九八四.md");
    expect(b).toContain('creator: "喬治・歐威爾"');
    expect(b).not.toContain("publisher");
    expect(b).toContain("private: true");
    expect(b).toContain("- 2026-10-04 → 閱讀中（讀墨）");
    expect(b).toContain("## 單字\n\n- [[doublethink]]");
    expect(w).toContain("## 書籍\n\n- [[一九八四]]");
  });

  it("相關清單附上段落", () => {
    const note = entry({
      id: "n",
      kind: "札記",
      title: "老大哥",
      meta: { locator: "第一部 第1章" },
    });
    const [b] = buildFiles([book, note], [["book", "n"]]);
    expect(b.content).toContain("- [[老大哥]]（第一部 第1章）");
  });

  it("連到不在清單裡的 id（私密）就略過", () => {
    const [b] = buildFiles([book], [["book", "secret"]]);
    expect(b.content).not.toContain("[[");
  });

  it("跨類型同名時連結帶資料夾", () => {
    const note = entry({ id: "n", kind: "札記", title: "一九八四" });
    const [b, n] = buildFiles([book, note], [["book", "n"]]).map((f) => f.content);
    expect(b).toContain("[[札記/一九八四]]");
    expect(n).toContain("[[書籍/一九八四]]");
  });

  it("檔名被截過時用別名顯示全文", () => {
    const quote = entry({ id: "q", kind: "佳句", title: "x".repeat(60) });
    const [b] = buildFiles([book, quote], [["book", "q"]]);
    expect(b.content).toContain(`[[${"x".repeat(40)}|${"x".repeat(60)}]]`);
  });
});
