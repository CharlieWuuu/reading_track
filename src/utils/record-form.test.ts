import { describe, expect, it } from "vitest";
import { templateByKey } from "@/config/kind-templates";
import { moduleDef } from "@/config/modules";
import { fieldsOf, resolveFormModules } from "./record-form";

const asOverrides = (key: string) => {
  const template = templateByKey(key)!;
  return template.modules.map((module) => ({
    key: module,
    label: template.labels?.[module] || moduleDef(module)!.label,
  }));
};

describe("resolveFormModules", () => {
  it("沒勾的模組不出現", () => {
    const keys = resolveFormModules(asOverrides("books")).map((m) => m.key);
    expect(keys).toContain("cover");
    expect(keys).not.toContain("gloss");
  });

  it("類型只改名字，模組還是同一批", () => {
    const book = resolveFormModules(asOverrides("books"));
    const movie = resolveFormModules(asOverrides("movie"));
    expect(book.find((m) => m.key === "creator")?.label).toBe("作者");
    expect(movie.find((m) => m.key === "creator")?.label).toBe("導演");
  });

  it("認不得的 key 忽略掉", () => {
    expect(resolveFormModules([{ key: "亂寫", label: "" }])).toHaveLength(0);
  });

  it("照給的順序排，除非指定 sortOrder", () => {
    const keys = resolveFormModules([
      { key: "title", label: "標題", sortOrder: 1 },
      { key: "cover", label: "封面圖", sortOrder: 0 },
    ]).map((m) => m.key);
    expect(keys).toEqual(["cover", "title"]);
  });
});

describe("fieldsOf", () => {
  it("一個模組展開成好幾欄", () => {
    const keys = fieldsOf(resolveFormModules([{ key: "topic", label: "領域" }])).map((f) => f.key);
    expect(keys).toEqual(["domain", "subDomain"]);
  });

  it("兩格日期是兩個模組，要哪個勾哪個", () => {
    const keys = fieldsOf(
      resolveFormModules([
        { key: "startDate", label: "開始日期" },
        { key: "endDate", label: "完成日期" },
      ]),
    ).map((f) => f.key);
    expect(keys).toEqual(["startDate", "endDate"]);
  });

  it("兩個模組指到同一欄只留一次", () => {
    const keys = fieldsOf(
      resolveFormModules([
        { key: "publisher", label: "出版社" },
        { key: "publisher", label: "又一個出版社" },
      ]),
    ).map((f) => f.key);
    expect(keys.filter((k) => k === "source")).toHaveLength(1);
  });
});
