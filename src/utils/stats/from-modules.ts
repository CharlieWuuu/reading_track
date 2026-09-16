import { moduleDef, type StatKind, type StatsExtraView } from "@/config/modules";
import type { FieldKey } from "@/config/record-fields";

/**
 * 一個類型勾了哪些模組，就該有哪幾張統計圖。
 *
 * 之前是三個 kind 各寫一份 use-*-sections（1829 行），開「影集」就得再寫一份。
 * 改成從模組推：模組庫的 stat 說這個模組出哪一種圖，這裡把勾選清單翻譯成
 * 圖表清單，畫面照著畫。新類型不用寫程式。
 *
 * 純函式，不碰資料——算出來的是「要畫什麼」，不是「畫出來的數字」。
 */

export type StatSpec = {
  /** 對應的模組，畫面用它當 React key */
  moduleKey: string;
  kind: StatKind;
  /** 圖表標題。類型改過模組的名字就跟著改（書籍的 creator 叫「作者」，電影叫「導演」） */
  label: string;
  /** 要看資料表的哪幾欄。tree 是兩欄（領域、次領域），其餘一欄 */
  fields: FieldKey[];
};

/**
 * 這個類型的統計頁有哪幾種看法。圖表永遠第一個，其餘照模組有沒有勾。
 *
 * 數線要兩格日期都有：只有開始沒有完成，畫出來每一條都沒有盡頭。
 * 其餘一個模組對一種看法，模組庫的 view 說了算。
 */
export function viewsOfModules(moduleKeys: readonly string[]): ("chart" | StatsExtraView)[] {
  const has = new Set(moduleKeys);
  const extra = moduleKeys.flatMap((key) => {
    const view = moduleDef(key)?.view;
    if (!view) return [];
    if (view === "timeline" && !(has.has("startDate") && has.has("endDate"))) return [];
    return [view];
  });
  return ["chart", ...new Set(extra)];
}

/** 出圖的順序：先看整體趨勢，再看分布，最後才是名次 */
const ORDER: StatKind[] = ["trend", "sum", "tree", "distribution", "ranking"];

/**
 * 勾選的模組 → 統計圖清單。
 *
 * labels 是這個類型替模組取的名字（書籍把 creator 叫「作者」），沒有就用模組庫的預設。
 */
export function statsOfModules(
  moduleKeys: readonly string[],
  labels: Readonly<Record<string, string>> = {},
): StatSpec[] {
  const specs = moduleKeys.flatMap((key) => {
    const def = moduleDef(key); // 不叫 module：Next.js 那條規則擋這個名字
    if (!def?.stat) return [];
    return [
      {
        moduleKey: key,
        kind: def.stat,
        label: labels[key] || def.label,
        fields: [...def.fields],
      },
    ];
  });

  // 同一種圖之間保持勾選的順序，種類之間照 ORDER
  return specs.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
}
