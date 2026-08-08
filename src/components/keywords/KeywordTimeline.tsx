"use client";

import Link from "next/link";
import { SEQUENTIAL } from "@/lib/chartPalette";
import { KeywordEntry } from "@/lib/keywordStats";
import { KeywordInfo, parseSpan } from "@/types/keyword";

const styles = {
  wrap: "flex h-full min-h-0 flex-col gap-2",
  scroll: "min-h-0 flex-1 overflow-y-auto",
  lanes: "flex flex-col gap-1.5",
  lane: "relative h-6",
  bar: "absolute flex h-6 items-center rounded px-1.5 text-[11px] whitespace-nowrap text-white",
  point: "absolute flex h-6 items-center gap-1 text-[11px] text-gray-600",
  dot: "h-2 w-2 shrink-0 rounded-full",
  axis: "relative h-5 shrink-0 border-t text-[10px] text-gray-400",
  tick: "absolute -translate-x-1/2 pt-0.5 tabular-nums",
  empty: "flex h-full items-center justify-center text-xs text-gray-400",
};

/** 只有單邊年份的畫成點，兩邊都有的畫成長條 */
type Span = { name: string; from: number; to: number; exact: boolean };

const TICK_COUNT = 5;
/** 兩端各留一點空白，最左最右的標籤才不會貼著邊 */
const PAD_RATIO = 0.04;

type KeywordTimelineProps = {
  entries: KeywordEntry[];
  infos: Map<string, KeywordInfo>;
};

/** 有生卒／起訖的關鍵字排成數線，重疊的往下疊一列 */
export function KeywordTimeline({ entries, infos }: KeywordTimelineProps) {
  const spans = toSpans(entries, infos);

  if (spans.length === 0) {
    return <div className={styles.empty}>還沒有帶年代的關鍵字，先按「補齊資料」查維基</div>;
  }

  const min = Math.min(...spans.map((s) => s.from));
  const max = Math.max(...spans.map((s) => s.to));
  const pad = Math.max(1, (max - min) * PAD_RATIO);
  const left = min - pad;
  const right = max + pad;
  const percent = (year: number) => ((year - left) / (right - left)) * 100;

  return (
    <div className={styles.wrap}>
      <div className={styles.scroll}>
        <div className={styles.lanes}>
          {packLanes(spans).map((lane, i) => (
            <div key={i} className={styles.lane}>
              {lane.map((span) => (
                <Bar key={span.name} span={span} percent={percent} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.axis}>
        {ticks(left, right).map((year) => (
          <span key={year} className={styles.tick} style={{ left: `${percent(year)}%` }}>
            {label(year)}
          </span>
        ))}
      </div>
    </div>
  );
}

function Bar({ span, percent }: { span: Span; percent: (year: number) => number }) {
  const href = `/books?keyword=${encodeURIComponent(span.name)}`;
  const title = `${span.name}｜${label(span.from)}${span.exact ? `－${label(span.to)}` : ""}`;

  // 起訖同一年（或只有單邊）沒有寬度可畫，改成一個點加上文字
  if (!span.exact || span.from === span.to) {
    return (
      <Link
        href={href}
        title={title}
        className={styles.point}
        style={{ left: `${percent(span.from)}%` }}
      >
        <span className={styles.dot} style={{ background: SEQUENTIAL[0] }} />
        {span.name}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      title={title}
      className={styles.bar}
      style={{
        left: `${percent(span.from)}%`,
        width: `${percent(span.to) - percent(span.from)}%`,
        background: SEQUENTIAL[0],
      }}
    >
      {span.name}
    </Link>
  );
}

/** 西元前寫成「前 384」，比負號好讀 */
function label(year: number): string {
  return year < 0 ? `前 ${Math.abs(year)}` : String(year);
}

function ticks(left: number, right: number): number[] {
  const step = (right - left) / (TICK_COUNT - 1);
  return Array.from({ length: TICK_COUNT }, (_, i) => Math.round(left + step * i));
}

/** 同一列裡互不重疊就共用一列，列數才不會等於關鍵字數（做法同 ReadingTimeline） */
function packLanes(spans: Span[]): Span[][] {
  const sorted = [...spans].sort((a, b) => b.to - b.from - (a.to - a.from) || a.from - b.from);
  const lanes: Span[][] = [];
  for (const span of sorted) {
    const lane = lanes.find((row) => row.every((s) => span.from >= s.to || span.to <= s.from));
    if (lane) lane.push(span);
    else lanes.push([span]);
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
    spans.push({ name: entry.name, from, to, exact: span.from !== null && span.to !== null });
  }
  return spans;
}
