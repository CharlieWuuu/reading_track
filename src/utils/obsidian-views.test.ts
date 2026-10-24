import { describe, expect, it } from "vitest";
import { kindPage, renderStats } from "@/utils/obsidian-views";

describe("renderStats", () => {
  it("閱讀中用嵌入查詢、圖交給 Dataview，不寫連結", () => {
    const { path, content } = renderStats();
    expect(path).toBe("01 紀錄/閱讀統計.md");
    expect(content).toContain("## 閱讀中\n\n```dataviewjs");
    expect(content).toContain('"folder":"99 資料/01 紀錄/閱讀紀錄","work":true');
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
