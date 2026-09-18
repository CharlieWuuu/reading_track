import type { StatRow } from "@/utils/stats/generic-stats";

/**
 * 地圖與年代要的形狀。兩者都是「一筆一個東西」——一筆有座標就是一個點，
 * 一筆有起訖年就是一條線。跟書沒有關係：關鍵字如此，影集哪天勾了座標也如此。
 *
 * 純函式，不碰資料來源——rows 哪來的由呼叫端決定。
 */

export type GeoPoint = { name: string; lat: number; lon: number };

export type EraSpan = {
  name: string;
  from: number;
  to: number;
  /** 只有一個年份（生年沒有卒年、還在持續），畫成一個點而不是一段 */
  point: boolean;
};

/** 數字欄位在 StatRow 裡是字串，空字串與認不得的一律當沒填 */
function num(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** 有經緯度的那幾筆。兩格都要有——只有一格定不出位置 */
export function geoPoints(rows: StatRow[], titleField = "title"): GeoPoint[] {
  return rows.flatMap((row) => {
    const lat = num(row.latitude);
    const lon = num(row.longitude);
    if (lat === null || lon === null) return [];
    return [{ name: String(row[titleField] ?? ""), lat, lon }];
  });
}

/**
 * 有年份的那幾筆，照起始年排。
 *
 * 只有結束年沒有起始年的不畫：一段要有起點才知道從哪裡開始。
 * 反過來只有起始年是可以的——還在持續，或只知道生年。
 */
export function eraSpans(rows: StatRow[], titleField = "title"): EraSpan[] {
  return rows
    .flatMap((row) => {
      const from = num(row.startYear);
      if (from === null) return [];
      const to = num(row.endYear);
      return [
        {
          name: String(row[titleField] ?? ""),
          from,
          to: to ?? from,
          point: to === null || to === from,
        },
      ];
    })
    .sort((a, b) => a.from - b.from || a.to - b.to);
}
