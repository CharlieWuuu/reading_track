import { describe, expect, it } from "vitest";
import { DEFAULT_KINDS } from "@/config/record-kinds";
import { resolveFormFields, splitByLayer } from "./record-form";

const book = DEFAULT_KINDS.find((k) => k.key === "book")!;
const article = DEFAULT_KINDS.find((k) => k.key === "article")!;

describe("resolveFormFields", () => {
  it("沒被提到的欄位照樣出現，用預設標籤", () => {
    const fields = resolveFormFields([]);
    expect(fields.map((f) => f.key)).toContain("creator");
    expect(fields.find((f) => f.key === "creator")?.label).toBe("創作者");
  });

  it("類型只改名字，欄位還是同一批", () => {
    const plain = resolveFormFields([]);
    const asBook = resolveFormFields(book.fields);
    expect(asBook.find((f) => f.key === "creator")?.label).toBe("作者");
    expect(asBook.find((f) => f.key === "amount")?.label).toBe("頁數");
    expect(asBook.length).toBe(plain.length);
  });

  it("藏起來的欄位不畫", () => {
    const fields = resolveFormFields(article.fields);
    expect(fields.map((f) => f.key)).not.toContain("startDate");
    expect(fields.find((f) => f.key === "amount")?.label).toBe("字數");
  });

  it("被改名的排在前面，其餘照欄位庫的順序", () => {
    const keys = resolveFormFields([{ key: "amount", sortOrder: 0 }]).map((f) => f.key);
    expect(keys[0]).toBe("amount");
    expect(keys[1]).toBe("title");
  });

  it("認不得的 key 忽略掉", () => {
    const fields = resolveFormFields([{ key: "亂寫", label: "亂" }]);
    expect(fields.map((f) => f.label)).not.toContain("亂");
  });
});

describe("splitByLayer", () => {
  it("作品與那一次的欄位分開", () => {
    const { record, experience } = splitByLayer(resolveFormFields(book.fields));
    expect(record.map((f) => f.key)).toContain("title");
    expect(experience.map((f) => f.key)).toContain("amount");
    expect(record.map((f) => f.key)).not.toContain("amount");
  });
});
