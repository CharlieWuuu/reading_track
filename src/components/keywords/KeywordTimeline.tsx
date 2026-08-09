"use client";

import Link from "next/link";
import { KeywordEntry } from "@/lib/keywordStats";
import { KeywordInfo, parseSpan } from "@/types/keyword";

const styles = {
  wrap: "h-full min-h-0 overflow-auto",
  ticks: "sticky top-0 z-10 flex border-b bg-white",
  tick: "shrink-0 border-l px-1 py-1 text-xs text-gray-400 tabular-nums first:border-l-0",
  lanes: "flex flex-col gap-0.5 px-0.5 py-1",
  lane: "relative h-4 shrink-0",
  bar: "absolute flex h-4 flex-col justify-end overflow-hidden",
  label: "translate-y-0.5 truncate text-[9px] leading-2.5 text-[#2B5A8E]",
  line: "relative h-1.5 shrink-0",
  stroke: "absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-[#2B5A8E]",
  dot: "absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#2B5A8E]",
  empty: "flex h-full items-center justify-center text-xs text-gray-400",
};

/** 一格刻度多寬。整條數線就是刻度數乘這個寬度，超出畫面就橫向捲 */
const TICK_WIDTH = 120;

/** 一格刻度涵蓋幾年。挑一個讓刻度數落在十來格的級距，不然不是擠成一團就是捲不完 */
const STEPS = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000, 2000];
const TARGET_TICKS = 12;

/** 只有一個點的（或短到看不見的）也要留得下名字 */
const MIN_WIDTH = 56;

type Span = { name: string; from: number; to: number; point: boolean };

type Segment = Span & { start: number; width: number };

type KeywordTimelineProps = {
  entries: KeywordEntry[];
  infos: Map<string, KeywordInfo>;
};

/** 有生卒／起訖的關鍵字排成一條數線，橫向捲 */
export function KeywordTimeline({ entries, infos }: KeywordTimelineProps) {
  const spans = toSpans(entries, infos);

  if (spans.length === 0) {
    return <div className={styles.empty}>還沒有帶年代的關鍵字，先按「補齊資料」查維基</div>;
  }

  const min = Math.min(...spans.map((s) => s.from));
  const max = Math.max(...spans.map((s) => s.to));
  const step = pickStep(max - min);
  const first = Math.floor(min / step) * step;
  const last = Math.ceil((max + 1) / step) * step;

  const ticks: number[] = [];
  for (let year = first; year < last; year += step) ticks.push(year);

  const width = ticks.length * TICK_WIDTH;
  const segments = place(spans, first, step);

  return (
    <div className={styles.wrap}>
      <div style={{ width }}>
        <div className={styles.ticks}>
          {ticks.map((year) => (
            <div key={year} className={styles.tick} style={{ width: TICK_WIDTH }}>
              {label(year)}
            </div>
          ))}
        </div>

        <div className={styles.lanes}>
          {packLanes(segments).map((lane, i) => (
            <div key={i} className={styles.lane}>
              {lane.map((segment) => (
                <Bar key={segment.name} segment={segment} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Bar({ segment }: { segment: Segment }) {
  const range = segment.point
    ? label(segment.from)
    : `${label(segment.from)}－${label(segment.to)}`;

  return (
    <Link
      href={`/books?keyword=${encodeURIComponent(segment.name)}`}
      title={`${segment.name}｜${range}`}
      style={{ left: segment.start, width: segment.width }}
      className={styles.bar}
    >
      {/* 名字直接貼在自己的線上；往右讓開，不然第一個字會壓在起點的圓點上 */}
      <span className={`${styles.label} pl-2`}>{segment.name}</span>
      <span className={styles.line}>
        <span className={styles.stroke} />
        <span className={`${styles.dot} left-0`} />
        <span className={`${styles.dot} right-0`} />
      </span>
    </Link>
  );
}

function pickStep(range: number): number {
  return STEPS.find((step) => range / step <= TARGET_TICKS) ?? STEPS[STEPS.length - 1];
}

/** 西元前寫成「前 384」，比負號好讀 */
function label(year: number): string {
  const rounded = Math.round(year);
  return rounded < 0 ? `前 ${Math.abs(rounded)}` : String(rounded);
}

/** 年份換算成數線上的位置與長度（px） */
function place(spans: Span[], first: number, step: number): Segment[] {
  const perYear = TICK_WIDTH / step;

  return spans.map((span) => ({
    ...span,
    start: (span.from - first) * perYear,
    width: Math.max((span.to - span.from) * perYear, MIN_WIDTH),
  }));
}

/** 互不重疊就共用一排，排數才不會等於關鍵字數（做法同 ReadingTimeline） */
function packLanes(segments: Segment[]): Segment[][] {
  const sorted = [...segments].sort((a, b) => b.width - a.width || a.start - b.start);
  const lanes: Segment[][] = [];

  for (const segment of sorted) {
    const lane = lanes.find((row) =>
      row.every(
        (s) => segment.start >= s.start + s.width || segment.start + segment.width <= s.start,
      ),
    );
    if (lane) lane.push(segment);
    else lanes.push([segment]);
  }
  return lanes;
}

function toSpans(entries: KeywordEntry[], infos: Map<string, KeywordInfo>): Span[] {
  const spans: Span[] = [];

  for (const entry of entries) {
    const info = infos.get(entry.name);
    // 有座標的是地點，畫在地圖上就好——主檔裡舊的列可能還留著建城年
    if (info?.coordinates) continue;
    const span = parseSpan(info?.span ?? "");
    if (!span) continue;

    // 只有出生沒有死亡（還活著、或維基沒寫）就當成一個點，不要假裝有個結束年
    const from = span.from ?? span.to!;
    const to = span.to ?? span.from!;
    spans.push({ name: entry.name, from, to, point: from === to });
  }
  return spans;
}
