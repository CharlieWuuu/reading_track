import { splitTags } from "@/types/book";
import type { DistributionGroup, DistributionSlice } from "@/utils/stats/book-stats";
import type { StatSpec } from "@/utils/stats/from-modules";

/**
 * 照 StatSpec 算出圖表要的數字。任何類型都走這一支——
 * 之前是 book/article/writing 各一份，開新類型就得再寫一份。
 *
 * 進來的是一批「欄位 → 值」的列，不認得 Book 或 Writing 那些形狀，
 * 所以紀錄、片段、書寫共用同一套算法。
 */

/** 統計吃的最小形狀：欄位鍵對到字串。數字與日期也是字串，跟表單同一套 */
export type StatRow = Record<string, string | null | undefined>;

const valuesOf = (row: StatRow, field: string): string[] => splitTags(String(row[field] ?? "")); // 一格可能放多個值（標籤、屬性），各算一次

/** 出現最多的前幾名。空白不列入——「未填」不是一個名次 */
export function ranking(rows: StatRow[], field: string, limit = 5): DistributionSlice[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const name of valuesOf(row, field)) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "zh-Hant"))
    .slice(0, limit);
}

/** 佔比。整格空白的算「未分類」，因為「有多少還沒分類」本身是資訊 */
export function distribution(rows: StatRow[], field: string): DistributionSlice[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const names = valuesOf(row, field);
    for (const name of names.length ? names : ["未分類"]) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "zh-Hant"));
}

/**
 * 父子兩層的佔比（領域＋次領域）。
 *
 * 只填了父層的那些歸在父層自己底下一格「其他」——不能丟掉，
 * 41 筆書只填了領域沒填次領域，丟掉的話樹狀圖會少一大塊。
 */
export function tree(
  rows: StatRow[],
  parentField: string,
  childField: string,
): DistributionGroup[] {
  const groups = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const parent = valuesOf(row, parentField)[0] ?? "未分類";
    const child = valuesOf(row, childField)[0] ?? "其他";
    if (!groups.has(parent)) groups.set(parent, new Map());
    const children = groups.get(parent)!;
    children.set(child, (children.get(child) ?? 0) + 1);
  }

  return [...groups.entries()]
    .map(([name, children]) => ({
      name,
      children: [...children.entries()]
        .map(([childName, value]) => ({ name: childName, value }))
        .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "zh-Hant")),
    }))
    .sort((a, b) => total(b.children) - total(a.children));
}

const total = (slices: DistributionSlice[]): number =>
  slices.reduce((sum, slice) => sum + slice.value, 0);

/** 總和與平均。空白與非數字不算進分母，不然平均會被沒填的稀釋 */
export function sum(rows: StatRow[], field: string): { total: number; average: number } {
  const numbers = rows
    .map((row) => Number(String(row[field] ?? "").replace(/[,，\s]/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!numbers.length) return { total: 0, average: 0 };
  const t = numbers.reduce((a, b) => a + b, 0);
  return { total: t, average: Math.round(t / numbers.length) };
}

/** 一張圖算好的資料。畫面照 kind 決定要畫哪一種元件 */
export type StatData =
  // 排行與分布資料形狀一樣，但分成兩個 variant：合成一個的話 filter 之後
  // TypeScript 收不窄，畫面拿不到 slices
  | { spec: StatSpec; kind: "ranking"; slices: DistributionSlice[] }
  | { spec: StatSpec; kind: "distribution"; slices: DistributionSlice[] }
  | { spec: StatSpec; kind: "tree"; groups: DistributionGroup[] }
  | { spec: StatSpec; kind: "sum"; total: number; average: number }
  | { spec: StatSpec; kind: "trend"; field: string };

/** 一組 spec 算成一組資料。trend 的月份序列交給既有的 getRecordMonthlyTrend，這裡只轉交欄位 */
export function statData(specs: StatSpec[], rows: StatRow[]): StatData[] {
  return specs.map((spec) => {
    const [first, second] = spec.fields;
    switch (spec.kind) {
      case "ranking":
        return { spec, kind: "ranking" as const, slices: ranking(rows, first) };
      case "distribution":
        return { spec, kind: "distribution" as const, slices: distribution(rows, first) };
      case "tree":
        return { spec, kind: "tree" as const, groups: tree(rows, first, second) };
      case "sum":
        return { spec, kind: "sum" as const, ...sum(rows, first) };
      case "trend":
        return { spec, kind: "trend" as const, field: first };
    }
  });
}
