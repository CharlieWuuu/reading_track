import { describe, expect, it } from "vitest";
import { kindBase, renderKindStats, renderStats } from "@/utils/obsidian-views";

describe("renderStats", () => {
  it("閱讀中用嵌入查詢、圖交給 Dataview，不寫連結", () => {
    const { path, content } = renderStats();
    expect(path).toBe("01 紀錄/閱讀統計.md");
    expect(content).toContain("## 閱讀中\n\n```base");
    expect(content).toContain('"folder":"99 資料/01 紀錄","work":true');
    expect(content).not.toContain("[[");
  });
});

describe("kindBase", () => {
  it("base 放層資料夾、篩資料夾裡的頁面，有圖才加卡片圖", () => {
    const withImage = kindBase("99 資料/02 片段/關鍵字", { image: true });
    expect(withImage.path).toBe("02 片段/關鍵字.base");
    expect(withImage.content).toContain('file.inFolder("99 資料/02 片段/關鍵字")');
    expect(withImage.content).toContain("image: note.cover");
    expect(kindBase("99 資料/02 片段/單字", { image: false }).content).not.toContain("image:");
    expect(withImage.content).not.toContain("      - pronunciation");
    expect(withImage.content).not.toContain("type: map"); // 地圖改在統計頁
    expect(withImage.content).toContain("displayName: 摘要");
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
    expect(content).toContain('dv.view("09 設定/views/地圖", {"kind":"書籍"})');
    expect(renderKindStats("99 資料/03 書寫/思緒").content).not.toContain("views/地圖");
  });
});
