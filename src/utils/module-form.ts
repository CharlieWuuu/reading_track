import { fieldDef, FieldDef, isWorkField } from "@/config/fields";
import { KindGroup } from "@/config/kind-groups";
import { moduleDef, ModuleDef, MODULES } from "@/config/modules";
import { BookCategories } from "@/types/book";

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

/** 這個 group 的表單有哪幾頁。只有紀錄分作品與這一次兩層，作品排第一：標題在那裡 */
export const formTabsOf = (group: KindGroup): readonly FormTab[] =>
  group === "records" ? ["work", "content", "attributes"] : ["content", "attributes"];

/** 欄位全部存在作品表。內部連結這種不佔欄位的不算 */
const isWorkModule = (module: FormModule): boolean =>
  module.fields.length > 0 && module.fields.every(isWorkField);

/**
 * 表單分頁。標了 attributes 的一律屬性頁。
 * 紀錄：其餘存作品表的歸作品頁，這一次的（日期、平台、連結）歸內容頁。
 * 片段、書寫：標了 content 的歸內容頁，其餘屬性頁。
 */
export function splitByTab(
  modules: readonly FormModule[],
  group: KindGroup,
): Record<FormTab, FormModule[]> {
  const isAttr = (module: FormModule) => module.tab === "attributes";
  if (group === "records") {
    const rest = modules.filter((module) => !isAttr(module));
    return {
      work: rest.filter(isWorkModule),
      content: rest.filter((module) => !isWorkModule(module)),
      attributes: modules.filter(isAttr),
    };
  }
  return {
    work: [],
    content: modules.filter((module) => module.tab === "content"),
    attributes: modules.filter((module) => module.tab !== "content"),
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

/** 長文撐滿頁面剩下的高度：寫心得、摘要時框越大越好寫，四行一下就滿了 */
export const isFillField = (field: FieldDef): boolean => field.type === "longText";

/** 表單上的一格：哪個模組的哪一欄，叫什麼名字 */
export type FormCell = { module: FormModule; field: FieldDef; label: string };

/**
 * 模組展開成一格一格。只有一欄的模組用模組名（使用者在設定頁改的就是那個名字）；
 * 多欄的每一欄用自己的預設名——「狀態」展開成開始與結束，第一格叫「狀態」會讓人以為要填狀態。
 */
export const cellsOf = (modules: readonly FormModule[]): FormCell[] =>
  modules.flatMap((module) => {
    const fields = fieldsOf([module]);
    return fields.map((field) => ({
      module,
      field,
      label: fields.length === 1 ? module.label : field.defaultLabel,
    }));
  });

/**
 * 照順序兩兩一排，寬的（isWideField）自己一列。
 *
 * 排成列而不是一整片格線：有長文的那一列要撐滿剩下的高度，得知道長文在哪一列。
 * 不跳著補位——畫面順序要跟 Tab 鍵移動的順序一樣。
 */
export function pairRows(cells: readonly FormCell[]): FormCell[][] {
  return cells.reduce<FormCell[][]>((rows, cell) => {
    const last = rows.at(-1);
    const joinable = last?.length === 1 && !isWideField(last[0].field) && !isWideField(cell.field);
    return joinable ? [...rows.slice(0, -1), [last[0], cell]] : [...rows, [cell]];
  }, []);
}

/** 分類型別對到哪一組選項：主題樹兩層與屬性 */
const CATEGORY_BY_TYPE: Partial<Record<FieldDef["type"], keyof BookCategories>> = {
  topic: "domain",
  topicChild: "subDomain",
  attribute: "type",
};

/**
 * 這一欄要畫成選單的話，選項從哪一組來；不是選單回 undefined。
 *
 * 選項不是另外維護的清單，是從既有資料 group 出來的，所以值存名字不是編號——
 * 換成 topic_id／attribute_id 是寫入那一層的事（見 mutations/taxonomy）。
 * 平台、語言是一般文字欄，靠欄位庫的 choices 標記接上選項。
 */
export const categoryOf = (field: FieldDef): keyof BookCategories | undefined =>
  CATEGORY_BY_TYPE[field.type] ?? field.choices;
