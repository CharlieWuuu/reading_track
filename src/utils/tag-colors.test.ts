import { describe, expect, it } from "vitest";
import { BookCategories } from "@/types/book";
import { TAG_COLORS, TAG_OUTLINE_COLORS, tagColorClass, tagOrder } from "./tag-colors";

const categories = {
  platform: ["紙本", "Kindle"],
  domain: ["心理", "歷史"],
  type: ["閒書"],
  language: ["中文"],
} as unknown as BookCategories;

describe("tagOrder", () => {
  it("平台、領域、屬性、語言依序串起來", () => {
    expect(tagOrder(categories)).toEqual(["紙本", "Kindle", "心理", "歷史", "閒書", "中文"]);
  });

  it("缺某一組不會炸（本機快取可能是舊版回應）", () => {
    expect(tagOrder({ domain: ["心理"] })).toEqual(["心理"]);
  });

  it("整個 undefined 也給空陣列", () => {
    expect(tagOrder(undefined)).toEqual([]);
  });
});

describe("tagColorClass", () => {
  const order = tagOrder(categories);

  it("顏色由標籤在選項清單裡的順序決定", () => {
    expect(tagColorClass("紙本", order)).toBe(TAG_COLORS[0]);
    expect(tagColorClass("Kindle", order)).toBe(TAG_COLORS[1]);
    expect(tagColorClass("心理", order)).toBe(TAG_COLORS[2]);
  });

  it("同一個標籤在不同列拿到同一個顏色", () => {
    expect(tagColorClass("心理", order)).toBe(tagColorClass("心理", order));
  });

  it("outline 取同一格的外框版", () => {
    expect(tagColorClass("Kindle", order, true)).toBe(TAG_OUTLINE_COLORS[1]);
  });

  it("不在清單裡的標籤靠雜湊，仍然固定", () => {
    const first = tagColorClass("手打的標籤", order);
    expect(TAG_COLORS).toContain(first);
    expect(tagColorClass("手打的標籤", order)).toBe(first);
  });

  it("順序超過色盤長度就繞回來", () => {
    const long = Array.from({ length: TAG_COLORS.length + 1 }, (_, i) => `t${i}`);
    expect(tagColorClass(long[TAG_COLORS.length], long)).toBe(TAG_COLORS[0]);
  });
});
