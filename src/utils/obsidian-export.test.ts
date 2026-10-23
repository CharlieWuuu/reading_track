import { describe, expect, it } from "vitest";
import {
  assignNames,
  buildFiles,
  excerpt,
  hasOwnContent,
  MARK_END,
  MARK_START,
  mergeManaged,
  type ExportEntry,
} from "@/utils/obsidian-export";

const entry = (over: Partial<ExportEntry>): ExportEntry => ({
  id: "00000000-0000-0000-0000-000000000000",
  kind: "書籍",
  folder: "01 紀錄/書籍",
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
      entry({ id: "a", folder: "02 片段/佳句", title: "a/b:c?" + "x".repeat(50) }),
    ]);
    expect(names.get("a")).toBe("02 片段/佳句/a b c " + "x".repeat(34));
  });

  it("整條路徑不超過 Drive 屬性上限（含撞名後綴）", () => {
    const title =
      "口袋沒你想得那麼簡單：從功能配件到文化象徵，小小口袋如何裝進性別、權力與身體政治";
    const names = assignNames([entry({ id: "p", folder: "03 書寫/札記", title })]);
    const full = `path${names.get("p")} (xxxxxx).md`;
    expect(new TextEncoder().encode(full).length).toBeLessThanOrEqual(124);
    expect(title.startsWith(names.get("p")!.split("/").pop()!)).toBe(true);
  });

  it("同資料夾撞名補 id 前六碼，不同資料夾不算撞", () => {
    const names = assignNames([
      entry({ id: "aaaaaa-1", title: "同名" }),
      entry({ id: "bbbbbb-2", title: "同名" }),
      entry({ id: "cccccc-3", folder: "02 片段/關鍵字", title: "同名" }),
    ]);
    expect([...names.values()]).toEqual([
      "01 紀錄/書籍/同名 (aaaaaa)",
      "01 紀錄/書籍/同名 (bbbbbb)",
      "02 片段/關鍵字/同名",
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
  const word = entry({ id: "word", kind: "單字", folder: "02 片段/單字", title: "doublethink" });

  it("frontmatter 略過空值，閱讀紀錄與雙向連結都寫在標記之間", () => {
    const files = buildFiles([book, word], [["word", "book"]]);
    const [b, w] = files.map((f) => f.content);
    expect(files[0].path).toBe("01 紀錄/書籍/一九八四.md");
    expect(b).toContain('creator: "喬治・歐威爾"');
    expect(b).not.toContain("publisher");
    expect(b).toContain("private: true");
    expect(b).toContain("- 2026-10-04 → 閱讀中（讀墨）");
    expect(b).toContain("## 單字\n\n- [[doublethink]]");
    expect(w).toContain("## 書籍\n\n- [[一九八四]]");
    expect(b.indexOf(MARK_START)).toBeLessThan(b.indexOf("# 一九八四"));
    expect(b.trimEnd().endsWith(MARK_END)).toBe(true);
  });

  it("相關清單附上段落", () => {
    const note = entry({
      id: "n",
      kind: "札記",
      folder: "03 書寫/札記",
      title: "老大哥",
      meta: { locator: "第一部 第1章" },
    });
    const [b] = buildFiles([book, note], [["book", "n"]]);
    expect(b.content).toContain("- [[老大哥]]（第一部 第1章）");
  });

  it("連到不在清單裡的 id 就略過", () => {
    const [b] = buildFiles([book], [["book", "secret"]]);
    expect(b.content).not.toContain("[[");
  });

  it("跨資料夾同名、或跟使用者的檔案同名時，連結帶路徑", () => {
    const note = entry({ id: "n", kind: "札記", folder: "03 書寫/札記", title: "一九八四" });
    const [b, n] = buildFiles([book, note], [["book", "n"]]).map((f) => f.content);
    expect(b).toContain("[[03 書寫/札記/一九八四]]");
    expect(n).toContain("[[01 紀錄/書籍/一九八四]]");
    const [w] = buildFiles([word, book], [["word", "book"]], new Set(["一九八四"]));
    expect(w.content).toContain("[[01 紀錄/書籍/一九八四]]");
  });

  it("檔名被截過時用別名顯示全文", () => {
    const quote = entry({ id: "q", kind: "佳句", folder: "02 片段/佳句", title: "x".repeat(60) });
    const [b] = buildFiles([book, quote], [["book", "q"]]);
    expect(b.content).toContain(`[[${"x".repeat(40)}|${"x".repeat(60)}]]`);
  });
});

describe("mergeManaged", () => {
  const generated = `---\narchivum_id: 1\ntags: ["地理"]\n---\n\n${MARK_START}\n# 倫敦\n新的\n${MARK_END}`;

  it("沒有舊檔就是新內容", () => {
    expect(mergeManaged(null, generated)).toBe(generated);
  });

  it("替換標記之間，標記外與自訂 frontmatter 保留，tags 聯集", () => {
    const old = `---\narchivum_id: 1\nstatus: 完成\ntags: ["我的"]\n---\n\n${MARK_START}\n# 倫敦\n舊的\n${MARK_END}\n\n## 我的補充\n霧都`;
    const merged = mergeManaged(old, generated);
    expect(merged).toContain("新的");
    expect(merged).not.toContain("舊的");
    expect(merged).toContain("## 我的補充\n霧都");
    expect(merged).toContain("status: 完成");
    expect(merged).toContain('tags: ["地理", "我的"]');
  });

  it("使用者原本的筆記沒有標記：archivum 那段放最上面，原文接在後面", () => {
    const old = `---\ntype: 名詞\n---\n\n我自己寫的解釋`;
    const merged = mergeManaged(old, generated);
    expect(merged.indexOf(MARK_START)).toBeLessThan(merged.indexOf("我自己寫的解釋"));
    expect(merged).toContain("type: 名詞");
  });
});

describe("hasOwnContent", () => {
  it("只有標記內的內容就算沒有", () => {
    expect(hasOwnContent(`---\na: 1\n---\n\n${MARK_START}\nx\n${MARK_END}\n`)).toBe(false);
    expect(hasOwnContent(`---\na: 1\n---\n\n${MARK_START}\nx\n${MARK_END}\n\n補充`)).toBe(true);
  });
});

describe("excerpt", () => {
  it("去掉標記、合併空白、超過就截斷加刪節號", () => {
    expect(excerpt("# 標題\n\n**粗體**  文字")).toBe("標題 粗體 文字");
    expect(excerpt("字".repeat(70))).toBe("字".repeat(60) + "…");
    expect(excerpt("")).toBe("");
  });
});
