import { describe, expect, it } from "vitest";
import { templateByKey } from "@/config/kind-templates";
import { fieldsOf, resolveFormModules } from "./record-form";

const asOverrides = (key: string) => {
  const template = templateByKey(key)!;
  return template.modules.map((module) => ({
    key: module,
    label: template.labels?.[module],
  }));
};

describe("resolveFormModules", () => {
  it("沒勾的模組不出現", () => {
    const keys = resolveFormModules(asOverrides("book")).map((m) => m.key);
    expect(keys).toContain("cover");
    expect(keys).not.toContain("gloss");
  });

  it("類型只改名字，模組還是同一批", () => {
    const book = resolveFormModules(asOverrides("book"));
    const movie = resolveFormModules(asOverrides("movie"));
    expect(book.find((m) => m.key === "creator")?.label).toBe("作者");
    expect(movie.find((m) => m.key === "creator")?.label).toBe("導演");
  });

  it("沒給標籤就用模組庫的預設名", () => {
    const modules = resolveFormModules([{ key: "title" }]);
    expect(modules[0].label).toBe("標題");
  });

  it("認不得的 key 忽略掉", () => {
    expect(resolveFormModules([{ key: "亂寫" }])).toHaveLength(0);
  });

  it("照給的順序排，除非指定 sortOrder", () => {
    const keys = resolveFormModules([
      { key: "title", sortOrder: 1 },
      { key: "cover", sortOrder: 0 },
    ]).map((m) => m.key);
    expect(keys).toEqual(["cover", "title"]);
  });
});

describe("fieldsOf", () => {
  it("一個模組展開成好幾欄", () => {
    const keys = fieldsOf(resolveFormModules([{ key: "progress" }])).map((f) => f.key);
    expect(keys).toEqual(["startDate", "endDate"]);
  });

  it("兩個模組指到同一欄只留一次", () => {
    const keys = fieldsOf(resolveFormModules([{ key: "progress" }, { key: "date" }])).map(
      (f) => f.key,
    );
    expect(keys.filter((k) => k === "endDate")).toHaveLength(1);
  });
});
