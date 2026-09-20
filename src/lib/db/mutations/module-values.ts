import { type Tx } from "@/lib/db/client";
import { FieldValues, pick } from "./catalog";
import { attributeIdFor, typeIdFor } from "./taxonomy";
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

/**
 * 領域與屬性存的是別張表的編號，畫面上送來的是名字，所以要在交易裡換一次
 * （沒有的順手建，跟這次寫入同生共死）。
 *
 * 跟其他欄位分開是因為它要 tx 與 userId——純轉換做不到。三個 group 共用同一份：
 * 一則心得屬於哪個領域，跟一本書屬於哪個領域是同一個問題。
 */
export async function taxonomyValues(
  tx: Tx,
  userId: string,
  values: FieldValues,
  allowed: Set<string>,
  /** 編輯時只動這次送來的；新增時一律寫，沒勾就是空 */
  onlyProvided = false,
): Promise<Record<string, unknown>> {
  const wants = (key: string) => allowed.has(key) && (!onlyProvided || values[key] !== undefined);

  const out: Record<string, unknown> = {};
  if (wants("domain") || wants("subDomain")) {
    out.topicId = await typeIdFor(tx, userId, values.domain ?? "", values.subDomain ?? "");
  }
  if (wants("attribute")) {
    out.attributeId = await attributeIdFor(tx, userId, values.attribute ?? "");
  }
  return out;
}
