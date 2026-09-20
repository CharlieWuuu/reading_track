import { FieldValues, pick } from "./catalog";
import { toDate, toFloat, toInt, toYear } from "./values";

/**
 * 模組的值攤成資料表的欄位。
 *
 * 三個 group 現在同一組欄位（0019），所以攤平的規則也只該有一份。原本每支
 * mutation 各自手寫一串 `pick(values, allowed, "…")`，漏掉哪一欄不會報錯——
 * 單字的「完成日期」就是這樣漏掉的，勾了永遠存不進去。
 *
 * 型別轉換跟著欄位走，不是跟著呼叫端：amount 一律轉整數、日期一律轉 date，
 * 哪一支 mutation 用它都一樣。
 */

/** 文字欄位：沒勾就是空字串（欄位本身 NOT NULL DEFAULT ''） */
const TEXT_FIELDS = [
  "title",
  "body",
  "creator",
  "translation",
  "locator",
  "pronunciation",
  "example",
  "exampleTranslation",
  "tags",
  "language",
  "platform",
  "externalId",
  "coverUrl",
] as const;

/** 沒勾就留 null 的那些。空字串跟「沒填」在數字與日期上是不同的意思 */
const NULLABLE = {
  startDate: toDate,
  endDate: toDate,
  amount: toInt,
  startYear: toYear,
  endYear: toYear,
  latitude: toFloat,
  longitude: toFloat,
} as const;

/**
 * 新增時要寫進去的一整組欄位。沒勾的模組一律給預設值——
 * 新增是從無到有，沒勾就是「這個類型沒有這一欄」。
 */
export function insertValues(values: FieldValues, allowed: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of TEXT_FIELDS) out[key] = pick(values, allowed, key);
  for (const [key, convert] of Object.entries(NULLABLE)) {
    out[key] = convert(pick(values, allowed, key));
  }
  out.isPrivate = pick(values, allowed, "isPrivate") === "是";
  return out;
}

/**
 * 編輯時要改的欄位。跟新增不同——沒勾、或這次沒送來的就不動它。
 *
 * 差別很重要：取消勾一個模組之後去編輯，用新增那套會把既有的值洗成空字串。
 */
export function updateValues(values: FieldValues, allowed: Set<string>): Record<string, unknown> {
  const has = (key: string) => allowed.has(key) && values[key] !== undefined;
  const out: Record<string, unknown> = {};
  for (const key of TEXT_FIELDS) if (has(key)) out[key] = values[key];
  for (const [key, convert] of Object.entries(NULLABLE)) {
    if (has(key)) out[key] = convert(values[key] ?? "");
  }
  if (has("isPrivate")) out.isPrivate = values.isPrivate === "是";
  return out;
}
