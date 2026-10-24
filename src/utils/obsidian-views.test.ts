import { describe, expect, it } from "vitest";
import { kindPage, renderRecords, renderStats } from "@/utils/obsidian-views";

describe("renderStats", () => {
  it("閱讀中用嵌入查詢、圖交給 Dataview，不寫連結", () => {
    const { path, content } = renderStats();
    expect(path).toBe("01 紀錄/閱讀統計.md");
    expect(content).toContain("## 閱讀中\n\n```dataviewjs");
    expect(content).toContain('"records":"99 資料/01 紀錄/閱讀紀錄.md","work":true');
    expect(content).not.toContain("[[");
  });
});

describe("kindPage", () => {
  it("一個類型一頁，交給類型檢視切換；作品用讀完日期、附地圖，不寫連結", () => {
    const { path, content } = kindPage("99 資料/01 紀錄/書籍");
    expect(path).toBe("01 紀錄/書籍.md");
    expect(content).toContain(
      'dv.view("09 設定/views/類型", {"folder":"99 資料/01 紀錄/書籍","work":true,"map":"kind"})',
    );
    expect(content).not.toContain("[[");
    expect(kindPage("99 資料/02 片段/關鍵字").content).toContain('"map":"keyword"');
    const thought = kindPage("99 資料/03 書寫/思緒").content;
    expect(thought).toContain('"work":false');
    expect(thought).not.toContain('"map"');
  });
});

describe("renderRecords", () => {
  it("一張表：資料在 frontmatter、作品是路徑字串不是連結，新的在前", () => {
    const { path, content } = renderRecords([
      {
        work: "99 資料/01 紀錄/書籍/舊.md",
        title: "舊",
        kind: "書籍",
        started: "2025-01-01",
        finished: "2025-01-09",
        platform: null,
      },
      {
        work: "99 資料/01 紀錄/書籍/新.md",
        title: "新",
        kind: "書籍",
        started: "2026-10-04",
        finished: null,
        platform: "讀墨",
      },
    ]);
    expect(path).toBe("99 資料/01 紀錄/閱讀紀錄.md");
    expect(content).not.toContain("[[");
    expect(content).toContain('  - work: "99 資料/01 紀錄/書籍/新.md"');
    expect(content.indexOf("| 新 |")).toBeLessThan(content.indexOf("| 舊 |"));
    expect(content).toContain("| 新 | 書籍 | 2026-10-04 | 閱讀中 | 讀墨 |");
  });
});
