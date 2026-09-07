import { FieldDef, fieldDef, RECORD_FIELDS } from "@/config/record-fields";

/**
 * 把「欄位庫」與「這個類型怎麼稱呼它」解析成表單要畫的清單。
 *
 * 覆寫來自 record_kind_fields（使用者改過的），或預設類型的 spec。
 * 沒被提到的欄位照樣要出現——類型只是改名字與藏東西，不是決定有哪些欄位。
 */

export type FieldOverride = { key: string; label?: string; hidden?: boolean; sortOrder?: number };

export type FormField = FieldDef & { label: string; sortOrder: number };

/** 沒被覆寫提到的欄位排在後面，彼此照欄位庫的順序 */
const BASE_ORDER = 1000;

export function resolveFormFields(overrides: readonly FieldOverride[]): FormField[] {
  const byKey = new Map(overrides.filter((o) => fieldDef(o.key)).map((o) => [o.key, o]));

  return RECORD_FIELDS.filter((def) => !byKey.get(def.key)?.hidden)
    .map((def) => {
      const over = byKey.get(def.key);
      return {
        ...def,
        label: over?.label || def.defaultLabel,
        sortOrder: over?.sortOrder ?? BASE_ORDER + RECORD_FIELDS.indexOf(def),
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** 表單分兩段畫：作品的欄位二刷時是唯讀的，那一次的欄位每次都要填 */
export const splitByLayer = (fields: readonly FormField[]) => ({
  record: fields.filter((f) => f.layer === "record"),
  experience: fields.filter((f) => f.layer === "experience"),
});
