import { moduleDef, ModuleDef, MODULES } from "@/config/modules";
import { fieldDef, FieldDef, isWorkField } from "@/config/record-fields";
import { KindGroup } from "@/config/record-kinds";

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
  /** 模組在這個類型叫什麼 */
  label: string;
  sortOrder?: number;
};

export type FormModule = ModuleDef & { label: string; sortOrder: number };

/**
 * 勾了的模組，加上每個類型都有的那幾個（標了 always 的）。
 *
 * always 那批排最後、不接受改名：它們不出現在設定頁的勾選清單裡，
 * 所以也沒有地方能改。寫在模組庫而不是表單裡，設定頁與表單才吃同一份。
 */
export function resolveFormModules(overrides: readonly ModuleOverride[]): FormModule[] {
  const picked = overrides
    .map((over, index) => {
      const def = moduleDef(over.key);
      return def ? { ...def, label: over.label, sortOrder: over.sortOrder ?? index } : null;
    })
    .filter((module): module is FormModule => module !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const has = new Set(picked.map((module) => module.key));
  const always = MODULES.filter((module) => "always" in module && !has.has(module.key)).map(
    (module, index) => ({ ...module, sortOrder: picked.length + index }),
  );
  return [...picked, ...always];
}

/**
 * 只有完成日期、沒有開始日期的類型，那一格就是「記下來的當下」——
 * 思緒、札記這種發佈即完成，日期沒有第二個答案，所以表單不開欄位，由 autoEndDate 補。
 */
export function hasAutoEndDate(modules: readonly FormModule[]): boolean {
  const keys = new Set(modules.map((module) => module.key));
  return keys.has("endDate") && !keys.has("startDate");
}

/** 表單真的要畫的模組：自動帶日期的類型不畫完成日期那一格 */
export function formModules(overrides: readonly ModuleOverride[]): FormModule[] {
  const modules = resolveFormModules(overrides);
  if (!hasAutoEndDate(modules)) return modules;
  return modules.filter((module) => module.key !== "endDate");
}

/** 自動帶的完成日期；不是自動帶的類型回 null，呼叫端就不要動那一欄 */
export function autoEndDate(
  modules: readonly FormModule[],
  today: string,
): { endDate: string } | null {
  return hasAutoEndDate(modules) ? { endDate: today } : null;
}

export type FormTab = "work" | "content" | "attributes";

export const FORM_TAB_LABELS: Record<FormTab, string> = {
  work: "作品",
  content: "內容",
  attributes: "屬性",
};

/** 這個 group 的表單有哪幾頁。只有紀錄分作品與紀錄兩層，作品排第一：標題在那裡 */
export const formTabsOf = (group: KindGroup): FormTab[] =>
  group === "records" ? ["work", "content", "attributes"] : ["content", "attributes"];

/** 模組的欄位全部存在作品表，就歸作品頁。空的（內部連結這種不佔欄位的）不算 */
const isWorkModule = (module: FormModule): boolean =>
  module.fields.length > 0 && module.fields.every(isWorkField);

/**
 * 表單分頁：模組自己說歸屬性頁的照說（見模組庫的 tab）；紀錄類其餘照欄位存在哪一層，
 * 作品表的歸作品頁、這一次的（日期、連結）歸內容頁。片段與書寫沒有作品頁。
 */
export function splitByTab(
  modules: readonly FormModule[],
  group: KindGroup,
): Record<FormTab, FormModule[]> {
  const attributes = modules.filter((module) => module.tab === "attributes");
  const rest = modules.filter((module) => module.tab !== "attributes");
  const work = group === "records" ? rest.filter(isWorkModule) : [];
  return {
    work,
    content: rest.filter((module) => !work.includes(module)),
    attributes,
  };
}

/** 這些模組實際要存哪幾欄。同一欄被兩個模組指到只留一次 */
export function fieldsOf(modules: readonly FormModule[]): FieldDef[] {
  const keys = [...new Set(modules.flatMap((module) => module.fields))];
  return keys.map(fieldDef).filter((def): def is FieldDef => def !== undefined);
}

/**
 * 表單兩兩一排時，哪些要自己佔一整列。照欄位型別判斷，不看是哪個欄位——
 * 自訂類型勾了什麼都適用。長文寫不下半寬，圖片要看得到預覽。
 */
const WIDE_TYPES = new Set<FieldDef["type"]>(["longText", "image"]);

export const isWideField = (field: FieldDef): boolean => WIDE_TYPES.has(field.type);
