import type { EraSpan } from "@/utils/stats/geo-stats";

/**
 * 年代數線的刻度與排版。純算術，不碰畫面也不碰資料來源。
 *
 * 從關鍵字那支數線抽出來——這幾件事（挑級距、西元前怎麼寫、哪幾條共用一排）
 * 跟關鍵字沒有關係，任何勾了起訖年的類型都一樣。
 */

/** 一格刻度多寬。整條數線就是刻度數乘這個寬度，超出畫面就橫向捲 */
export const TICK_WIDTH = 120;

/** 一格刻度涵蓋幾年。挑一個讓刻度數落在十來格的級距，不然不是擠成一團就是捲不完 */
const STEPS = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000, 2000];
const TARGET_TICKS = 12;

/** 名字要占的最小寬度。只用來分排，不會拿去畫線——畫線一律照真正的年份 */
const LABEL_WIDTH = 56;

/** width 是年份換算出來的真實長度，slot 是連名字一起算的佔位寬度 */
export type EraSegment = EraSpan & { start: number; width: number; slot: number };

export function pickStep(range: number): number {
  return STEPS.find((step) => range / step <= TARGET_TICKS) ?? STEPS[STEPS.length - 1];
}

/** 西元前寫成「前 384」，比負號好讀 */
export function yearLabel(year: number): string {
  const rounded = Math.round(year);
  return rounded < 0 ? `前 ${Math.abs(rounded)}` : String(rounded);
}

/** 整條數線的刻度：把起訖年往外對齊到級距的整數倍 */
export function ticksOf(spans: readonly EraSpan[]): {
  ticks: number[];
  first: number;
  step: number;
} {
  const min = Math.min(...spans.map((s) => s.from));
  const max = Math.max(...spans.map((s) => s.to));
  const step = pickStep(max - min);
  const first = Math.floor(min / step) * step;
  const last = Math.ceil((max + 1) / step) * step;

  const ticks: number[] = [];
  for (let year = first; year < last; year += step) ticks.push(year);
  return { ticks, first, step };
}

/** 年份換算成數線上的位置與長度（px） */
export function place(spans: readonly EraSpan[], first: number, step: number): EraSegment[] {
  const perYear = TICK_WIDTH / step;

  return spans.map((span) => {
    const width = (span.to - span.from) * perYear;
    return {
      ...span,
      start: (span.from - first) * perYear,
      width,
      slot: Math.max(width, LABEL_WIDTH),
    };
  });
}

/** 互不重疊就共用一排，排數才不會等於筆數（做法同 SpanTimeline） */
export function packLanes(segments: readonly EraSegment[]): EraSegment[][] {
  const sorted = [...segments].sort((a, b) => b.slot - a.slot || a.start - b.start);
  const lanes: EraSegment[][] = [];

  for (const segment of sorted) {
    const lane = lanes.find((row) =>
      row.every(
        (s) => segment.start >= s.start + s.slot || segment.start + segment.slot <= s.start,
      ),
    );
    if (lane) lane.push(segment);
    else lanes.push([segment]);
  }
  return lanes;
}
