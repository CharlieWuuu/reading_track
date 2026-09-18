"use client";

import { EraSegment, packLanes, place, TICK_WIDTH, ticksOf, yearLabel } from "@/utils/stats/era-scale";
import { eraSpans } from "@/utils/stats/geo-stats";
import type { StatRow } from "@/utils/stats/generic-stats";

const styles = {
  wrap: "flex h-full min-h-0 flex-col gap-2",
  scroller: "min-h-0 flex-1 overflow-auto",
  ticks: "sticky top-0 z-10 flex border-b bg-white",
  tick: "shrink-0 border-l px-1 py-1 text-xs text-gray-400 tabular-nums first:border-l-0",
  lanes: "flex flex-col gap-0.5 px-0.5 py-1",
  lane: "relative h-4 shrink-0",
  bar: "absolute flex h-4 flex-col justify-end text-left",
  label: "translate-y-0.5 whitespace-nowrap text-[9px] leading-2.5",
  line: "relative h-1.5 shrink-0",
  stroke: "absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-accent",
  dot: "absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent",
  // 圓點的圓心要正好落在那一年上，不然短的線看起來會整條偏掉
  dotStart: "left-0 -translate-x-1/2",
  dotEnd: "right-0 translate-x-1/2",
  empty: "flex h-full items-center justify-center text-xs text-gray-400",
};

/**
 * 有起訖年的那幾筆畫成數線。一筆一條線，只有起始年的畫成一個點。
 *
 * 舊版是關鍵字專用的：一條線算在某一本書名下、圖例秀書封。這一版不分顏色——
 * 線的位置與長度已經說完全部的資訊，再上色只會讓人以為顏色另有含意（同 SpanTimeline）。
 */
export function RowEra({ rows, onSelect }: { rows: StatRow[]; onSelect?: (name: string) => void }) {
  const spans = eraSpans(rows);
  if (spans.length === 0) {
    return <div className={styles.empty}>這裡還沒有帶年份的紀錄</div>;
  }

  const { ticks, first, step } = ticksOf(spans);
  const lanes = packLanes(place(spans, first, step));

  return (
    <div className={styles.wrap}>
      <div className={styles.scroller}>
        <div style={{ width: ticks.length * TICK_WIDTH }}>
          <div className={styles.ticks}>
            {ticks.map((year) => (
              <div key={year} className={styles.tick} style={{ width: TICK_WIDTH }}>
                {yearLabel(year)}
              </div>
            ))}
          </div>

          <div className={styles.lanes}>
            {lanes.map((lane, i) => (
              <div key={i} className={styles.lane}>
                {lane.map((segment) => (
                  <Bar key={segment.name} segment={segment} onSelect={onSelect} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Bar({ segment, onSelect }: { segment: EraSegment; onSelect?: (name: string) => void }) {
  const range = segment.point
    ? yearLabel(segment.from)
    : `${yearLabel(segment.from)}－${yearLabel(segment.to)}`;

  const content = (
    <>
      <div className={styles.line} style={{ width: segment.width || 1 }}>
        {segment.point ? (
          <span className={`${styles.dot} ${styles.dotStart}`} />
        ) : (
          <>
            <span className={styles.stroke} />
            <span className={`${styles.dot} ${styles.dotStart}`} />
            <span className={`${styles.dot} ${styles.dotEnd}`} />
          </>
        )}
      </div>
      <span className={styles.label}>
        {segment.name}
        <span className="text-ink-faint"> {range}</span>
      </span>
    </>
  );

  // 點得進去才包連結：沒有 onSelect 的類型（大部分自訂類型）不該長得像可以點
  return onSelect ? (
    <button
      type="button"
      onClick={() => onSelect(segment.name)}
      title={`${segment.name} ${range}`}
      className={styles.bar}
      style={{ left: segment.start }}
    >
      {content}
    </button>
  ) : (
    <div title={`${segment.name} ${range}`} className={styles.bar} style={{ left: segment.start }}>
      {content}
    </div>
  );
}
