import { describe, expect, it } from "vitest";
import { fieldDef } from "@/config/fields";
import { templateByKey } from "@/config/kind-templates";
import { moduleDef } from "@/config/modules";
import {
  autoEndDate,
  categoryOf,
  cellsOf,
  fieldsOf,
  formModules,
  hasAutoEndDate,
  isFillField,
  isWideField,
  pairRows,
  resolveFormModules,
  splitByTab,
} from "./module-form";

const asOverrides = (key: string) => {
  const template = templateByKey(key)!;
  return template.modules.map((module) => ({
    key: module,
    label: moduleDef(module)!.label,
  }));
};

describe("resolveFormModules", () => {
  it("沒勾的模組不出現", () => {
    const keys = resolveFormModules(asOverrides("books")).map((m) => m.key);
    expect(keys).toContain("cover");
    expect(keys).not.toContain("gloss");
  });

  it("使用者改的名字照用", () => {
    const modules = resolveFormModules([{ key: "creator", label: "導演" }]);
    expect(modules.find((m) => m.key === "creator")?.label).toBe("導演");
  });

  it("認不得的 key 忽略掉", () => {
    const keys = resolveFormModules([{ key: "亂寫", label: "" }]).map((m) => m.key);
    expect(keys).not.toContain("亂寫");
  });

  it("每個類型都有的那幾個自動帶上，不用勾", () => {
    const keys = resolveFormModules([{ key: "title", label: "標題" }]).map((m) => m.key);
    expect(keys).toContain("links");
    expect(keys).toContain("private");
  });

  it("勾過的不重複帶——勾了就照勾的順序與名字", () => {
    const modules = resolveFormModules([
      { key: "private", label: "不給看", sortOrder: 0 },
      { key: "title", label: "標題", sortOrder: 1 },
    ]);
    expect(modules.filter((m) => m.key === "private")).toHaveLength(1);
    expect(modules.find((m) => m.key === "private")?.label).toBe("不給看");
  });

  it("照給的順序排，除非指定 sortOrder", () => {
    const keys = resolveFormModules([
      { key: "title", label: "標題", sortOrder: 1 },
      { key: "cover", label: "封面圖", sortOrder: 0 },
    ])
      // 一律帶上的那幾個排最後，不影響勾選那批的順序
      .filter((m) => m.key === "title" || m.key === "cover")
      .map((m) => m.key);
    expect(keys).toEqual(["cover", "title"]);
  });
});

describe("fieldsOf", () => {
  it("一個模組展開成好幾欄", () => {
    // 一律帶上的那幾個也會展開，所以只看這個模組自己那兩欄
    const keys = fieldsOf(resolveFormModules([{ key: "topic", label: "領域" }])).map((f) => f.key);
    expect(keys.slice(0, 2)).toEqual(["domain", "subDomain"]);
  });

  it("兩格日期是兩個模組，要哪個勾哪個", () => {
    const keys = fieldsOf(
      resolveFormModules([
        { key: "startDate", label: "開始日期" },
        { key: "endDate", label: "完成日期" },
      ]),
    ).map((f) => f.key);
    expect(keys.slice(0, 2)).toEqual(["startDate", "endDate"]);
  });

  it("兩個模組指到同一欄只留一次", () => {
    const keys = fieldsOf(
      resolveFormModules([
        { key: "platform", label: "平台" },
        { key: "platform", label: "又一個平台" },
      ]),
    ).map((f) => f.key);
    expect(keys.filter((k) => k === "platform")).toHaveLength(1);
  });
});

describe("自動帶完成日期", () => {
  const single = [
    { key: "title", label: "標題" },
    { key: "endDate", label: "完成日期" },
  ];
  const ranged = [...single, { key: "startDate", label: "開始日期" }];

  it("只有完成日期的類型算自動帶", () => {
    expect(hasAutoEndDate(resolveFormModules(single))).toBe(true);
  });

  it("有開始日期就不自動帶——那是一段期間", () => {
    expect(hasAutoEndDate(resolveFormModules(ranged))).toBe(false);
  });

  it("沒有日期的類型也不自動帶", () => {
    expect(hasAutoEndDate(resolveFormModules([{ key: "title", label: "標題" }]))).toBe(false);
  });

  it("自動帶的類型表單不畫那一格", () => {
    expect(formModules(single).map((m) => m.key)).not.toContain("endDate");
  });

  it("要自己填的類型照樣畫得出來", () => {
    expect(formModules(ranged).map((m) => m.key)).toContain("endDate");
  });

  it("欄位照樣要存：不畫欄位不等於不存日期", () => {
    expect(fieldsOf(resolveFormModules(single)).map((f) => f.key)).toContain("endDate");
  });

  it("autoEndDate 給今天，不自動帶的回 null", () => {
    expect(autoEndDate(resolveFormModules(single), "2026-09-21")).toEqual({
      endDate: "2026-09-21",
    });
    expect(autoEndDate(resolveFormModules(ranged), "2026-09-21")).toBeNull();
  });
});

describe("splitByTab", () => {
  const modules = resolveFormModules(
    ["title", "creator", "longText", "cover", "startDate", "topic", "tags"].map((key) => ({
      key,
      label: key,
    })),
  );
  const { content, attributes } = splitByTab(modules);

  it("內容頁只有標題與內文", () => {
    expect(content.map((m) => m.key)).toEqual(["title", "longText"]);
  });

  it("其餘連同一律有的私人、關聯都歸屬性頁", () => {
    expect(attributes.map((m) => m.key)).toEqual(
      expect.arrayContaining([
        "creator",
        "cover",
        "startDate",
        "topic",
        "tags",
        "private",
        "links",
      ]),
    );
  });

  it("兩頁加起來就是全部，不重不漏", () => {
    expect(content.length + attributes.length).toBe(modules.length);
  });
});

describe("isWideField", () => {
  it("長文與圖片佔一整列，其餘兩兩一排", () => {
    const wide = ["body", "coverUrl", "title", "startDate", "domain"].filter((key) =>
      isWideField(fieldDef(key)!),
    );
    expect(wide).toEqual(["body", "coverUrl"]);
  });
});

describe("pairRows", () => {
  const rows = (keys: string[]) =>
    pairRows(cellsOf(resolveFormModules(keys.map((key) => ({ key, label: key }))))).map((row) =>
      row.map((cell) => cell.field.key),
    );

  it("兩兩一排，寬的自己一列，不跳著補位", () => {
    expect(rows(["title", "creator", "longText", "amount", "cover", "platform"])).toEqual([
      ["title", "creator"],
      ["body"],
      ["amount"],
      ["coverUrl"],
      ["platform", "isPrivate"], // 私人是每個類型都有的，排在最後；內部連結不佔欄位
    ]);
  });

  it("多欄的模組拆開，每欄用自己的名字", () => {
    const cells = cellsOf(resolveFormModules([{ key: "years", label: "起訖年" }]));
    expect(cells.map((cell) => cell.label).slice(0, 2)).toEqual(["起", "訖"]);
  });
});

describe("isFillField", () => {
  it("只有長文撐滿", () => {
    expect(["body", "title", "coverUrl"].filter((key) => isFillField(fieldDef(key)!))).toEqual([
      "body",
    ]);
  });
});

describe("categoryOf", () => {
  it("分類型別與標了 choices 的欄位畫成選單，其餘是輸入框", () => {
    const picked = ["domain", "subDomain", "attribute", "platform", "language", "title", "creator"];
    expect(picked.map((key) => categoryOf(fieldDef(key)!) ?? null)).toEqual([
      "domain",
      "subDomain",
      "type",
      "platform",
      "language",
      null,
      null,
    ]);
  });
});
