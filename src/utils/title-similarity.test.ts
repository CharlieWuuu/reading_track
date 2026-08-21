import { describe, expect, it } from "vitest";
import { titleSimilarity } from "./title-similarity";

describe("titleSimilarity", () => {
  it("完全相同是 1", () => {
    expect(titleSimilarity("深度工作力", "深度工作力")).toBe(1);
  });

  it("副標題不影響：主書名一樣就是同一本", () => {
    expect(titleSimilarity("深度工作力：淺薄時代，個人成功的關鍵能力", "深度工作力")).toBe(1);
  });

  it("剝掉【】與（）的版本標記", () => {
    expect(titleSimilarity("【暢銷新裝版】深度工作力", "深度工作力")).toBe(1);
    expect(titleSimilarity("深度工作力（二版）", "深度工作力")).toBe(1);
  });

  it("標點與大小寫不算差異", () => {
    expect(titleSimilarity("Deep Work", "deep-work")).toBe(1);
  });

  it("關鍵字在副標的會被刷掉，不是滿分", () => {
    const score = titleSimilarity("有聲書評：深度工作力", "深度工作力");

    expect(score).toBeLessThan(1);
    expect(score).toBeGreaterThan(0);
  });

  it("多出一大截的標題分數比剛好多一點的低", () => {
    const near = titleSimilarity("深度工作力手冊", "深度工作力");
    const far = titleSimilarity("深度工作力手冊完全圖解實踐指南增補版", "深度工作力");

    expect(near).toBeGreaterThan(far);
  });

  it("不相干的書分數低", () => {
    expect(titleSimilarity("被討厭的勇氣", "深度工作力")).toBeLessThan(0.3);
  });

  it("空字串是 0", () => {
    expect(titleSimilarity("", "深度工作力")).toBe(0);
    expect(titleSimilarity("深度工作力", "")).toBe(0);
  });

  it("只剩標點的標題是 0，不會爆", () => {
    expect(titleSimilarity("：：", "深度工作力")).toBe(0);
  });

  it("單字比對不會因為 bigram 取不到而誤判", () => {
    expect(titleSimilarity("書", "書")).toBe(1);
    expect(titleSimilarity("書", "海")).toBe(0);
  });

  it("分數一律落在 0~1", () => {
    const pairs: Array<[string, string]> = [
      ["深度工作力", "深度工作力"],
      ["深度工作力：副標", "深度"],
      ["Deep Work", "深度工作力"],
      ["", ""],
    ];

    for (const [a, b] of pairs) {
      const score = titleSimilarity(a, b);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });
});
