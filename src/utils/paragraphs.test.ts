import { describe, expect, it } from "vitest";
import { joinParagraphs } from "@/utils/paragraphs";

describe("joinParagraphs", () => {
  it("段與段之間空一行", () => {
    expect(joinParagraphs(["例句", "翻譯"])).toBe("例句\n\n翻譯");
  });

  it("空的跳過，不留多餘空行", () => {
    expect(joinParagraphs(["", "例句", "  ", undefined])).toBe("例句");
  });
});
