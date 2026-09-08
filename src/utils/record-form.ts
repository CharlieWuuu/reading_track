import { moduleDef, ModuleDef } from "@/config/modules";
import { fieldDef, FieldDef } from "@/config/record-fields";

/**
 * 把「這個類型勾了哪些模組」解析成表單要畫的清單。
 *
 * 模組是使用者看到的那一層，欄位是資料表那一層——「狀態」一個模組展開成
 * 開始與結束兩欄。所以表單問這支要畫什麼，寫入問 fields 要存哪幾欄。
 *
 * 沒勾的模組不會出現：不留空位，詳情頁也不顯示「—」。
 */

export type ModuleOverride = {
  key: string;
  /** 模組在這個類型叫什麼。空的就用模組庫的預設名 */
  label?: string;
  sortOrder?: number;
};

export type FormModule = ModuleDef & { label: string; sortOrder: number };

export function resolveFormModules(overrides: readonly ModuleOverride[]): FormModule[] {
  return overrides
    .map((over, index) => {
      const def = moduleDef(over.key);
      return def
        ? { ...def, label: over.label || def.label, sortOrder: over.sortOrder ?? index }
        : null;
    })
    .filter((module): module is FormModule => module !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** 這些模組實際要存哪幾欄。同一欄被兩個模組指到只留一次 */
export function fieldsOf(modules: readonly FormModule[]): FieldDef[] {
  const keys = [...new Set(modules.flatMap((module) => module.fields))];
  return keys.map(fieldDef).filter((def): def is FieldDef => def !== undefined);
}
