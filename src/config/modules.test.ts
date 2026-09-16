import { describe, expect, it } from "vitest";
import { KIND_TEMPLATES } from "./kind-templates";
import { fieldsOfModules, moduleDef, MODULES } from "./modules";
import { RECORD_FIELDS } from "./record-fields";

/**
 * 模組庫跟它指到的東西對不對得上。
 *
 * 2026-09-16 改了一批模組的 key（gloss→translation、context→example……），
 * 範本與資料庫的勾選都還停在舊名字。認不得的 key 等於沒勾，單字的例句就
 * 這樣從表單上消失了，而且沒有任何地方會報錯。
 */

describe("模組庫", () => {
  it("每個模組指到的欄位都存在", () => {
    const known = new Set(RECORD_FIELDS.map((field) => field.key));
    const missing = MODULES.flatMap((m) => m.fields.filter((key) => !known.has(key))).map(String);
    expect(missing).toEqual([]);
  });

  it("範本勾的模組都認得", () => {
    const missing = KIND_TEMPLATES.flatMap((template) =>
      template.modules.filter((key) => !moduleDef(key)).map((key) => `${template.key}: ${key}`),
    );
    expect(missing).toEqual([]);
  });

  it("範本改名字的對象也要是它自己勾了的模組", () => {
    const stray = KIND_TEMPLATES.flatMap((template) =>
      Object.keys(template.labels ?? {})
        .filter((key) => !template.modules.includes(key as never))
        .map((key) => `${template.key}: ${key}`),
    );
    expect(stray).toEqual([]);
  });

  it("展開成欄位時同一欄只留一次", () => {
    const keys = fieldsOfModules(["topic", "topic", "creator"]);
    expect(keys).toEqual([...new Set(keys)]);
  });
});
