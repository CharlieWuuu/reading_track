"use client";

import { useState } from "react";
import { KeywordPopup } from "@/features/keywords/components/keyword-popup";
import { BookCover } from "@/components/ui/book-cover";
import { CATEGORICAL } from "@/lib/chartPalette";
import { KeywordEntry } from "@/lib/keywordStats";
import { KeywordInfo, parseSpan } from "@/types/keyword";

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
  stroke: "absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2",
  dot: "absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full",
  // 圓點的圓心要正好落在那一年上，不然短的線看起來會整條偏掉
  dotStart: "left-0 -translate-x-1/2",
  dotEnd: "right-0 translate-x-1/2",
  empty: "flex h-full items-center justify-center text-xs text-gray-400",
  legend: "flex shrink-0 flex-wrap items-center gap-1.5",
  legendItem: "overflow-hidden rounded-[2px]",
  // 書用封面認，線的顏色畫成封面的外框，兩件事合成一個圖例（同地圖）
};

/** 色票只有八階，第九本之後一律用灰色，不自己生新顏色（同地圖） */
const OVERFLOW_COLOR = "#9CA3AF";
const OVERFLOW_LABEL = "其他";

/** 一格刻度多寬。整條數線就是刻度數乘這個寬度，超出畫面就橫向捲 */
const TICK_WIDTH = 120;

/** 一格刻度涵蓋幾年。挑一個讓刻度數落在十來格的級距，不然不是擠成一團就是捲不完 */
const STEPS = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000, 2000];
const TARGET_TICKS = 12;

/** 名字要占的最小寬度。只用來分排，不會拿去畫線——畫線一律照真正的年份 */
const LABEL_WIDTH = 56;

type Span = {
  name: string;
  from: number;
  to: number;
  point: boolean;
  open: boolean;
  /** 這條線算在哪一本書名下：一個關鍵字被多本書提到時，取最近讀完的那本 */
  book: string;
  color: string;
};

/** width 是年份換算出來的真實長度，slot 是連名字一起算的佔位寬度 */
type Segment = Span & { start: number; width: number; slot: number };

type KeywordTimelineProps = {
  entries: KeywordEntry[];
  infos: Map<string, KeywordInfo>;
};

/** 有生卒／起訖的關鍵字排成一條數線，橫向捲 */
export function KeywordTimeline({ entries, infos }: KeywordTimelineProps) {
  const [viewing, setViewing] = useState<string | null>(null);
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
      <div className={styles.scroller}>
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
                  <Bar
                    key={segment.name}
                    segment={segment}
                    onOpen={() => setViewing(segment.name)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 一本書一個顏色，沒有圖例就看不出線是誰的（同地圖） */}
      <ul className={styles.legend}>
        {legendOf(spans, coverByBook(entries)).map((item) => (
          <li
            key={item.title}
            title={item.title}
            className={styles.legendItem}
            style={{ outline: `2px solid ${item.color}`, outlineOffset: "-2px" }}
          >
            <BookCover url={item.cover} title={item.title} size="sm" flat />
          </li>
        ))}
      </ul>

      {viewing && <KeywordPopup name={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function Bar({ segment, onOpen }: { segment: Segment; onOpen: () => void }) {
  const range = segment.point
    ? label(segment.from)
    : `${label(segment.from)}－${segment.open ? "至今" : label(segment.to)}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      title={`${segment.name}｜${range}`}
      style={{ left: segment.start, width: segment.width }}
      className={styles.bar}
    >
      {/* 名字直接貼在自己的線上；往右讓開，不然第一個字會壓在起點的圓點上 */}
      <span className={`${styles.label} pl-2`} style={{ color: segment.color }}>
        {segment.name}
      </span>
      <span className={styles.line}>
        <span className={styles.stroke} style={{ background: segment.color }} />
        <span
          className={`${styles.dot} ${styles.dotStart}`}
          style={{ background: segment.color }}
        />
        {/* 還沒結束的不點收尾：線畫到今年只是表示還在持續，那一年不是它的結束年 */}
        {!segment.open && (
          <span
            className={`${styles.dot} ${styles.dotEnd}`}
            style={{ background: segment.color }}
          />
        )}
      </span>
    </button>
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

/** 互不重疊就共用一排，排數才不會等於關鍵字數（做法同 ReadingTimeline） */
function packLanes(segments: Segment[]): Segment[][] {
  const sorted = [...segments].sort((a, b) => b.slot - a.slot || a.start - b.start);
  const lanes: Segment[][] = [];

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

function toSpans(entries: KeywordEntry[], infos: Map<string, KeywordInfo>): Span[] {
  const spans: Omit<Span, "color">[] = [];

  for (const entry of entries) {
    const info = infos.get(entry.name);
    // 有座標的畫在地圖上就好，年代仍然記在主檔裡，只是不上數線
    if (info?.coordinates) continue;
    const span = parseSpan(info?.span ?? "");
    if (!span) continue;

    // 只有開頭沒有結尾（還活著、或還在持續）就一路畫到今年，不要縮成一個點
    const open = span.from !== null && span.to === null;
    const from = span.from ?? span.to!;
    const to = open ? new Date().getFullYear() : (span.to ?? span.from!);
    const book = entry.books[0];
    spans.push({ name: entry.name, from, to, point: from === to, open, book: book?.title ?? "" });
  }

  const colors = colorByBook(spans.map((s) => s.book));
  return spans.map((span) => ({ ...span, color: colors.get(span.book) ?? OVERFLOW_COLOR }));
}

/** 條數多的書排前面拿到深色；超出色票的共用灰色 */
function colorByBook(books: string[]): Map<string, string> {
  const counts = new Map<string, number>();
  for (const book of books) counts.set(book, (counts.get(book) ?? 0) + 1);

  return new Map(
    [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hant"))
      .map(([book], i) => [book, i < CATEGORICAL.length ? CATEGORICAL[i] : OVERFLOW_COLOR]),
  );
}

/** 書名對封面，畫圖例要用 */
function coverByBook(entries: KeywordEntry[]): Map<string, string> {
  const covers = new Map<string, string>();
  for (const entry of entries) {
    for (const book of entry.books) covers.set(book.title, book.coverUrl);
  }
  return covers;
}

/** 一本書一格圖例；超出色票的收成一個「其他」 */
function legendOf(
  spans: Span[],
  covers: Map<string, string>,
): Array<{ title: string; cover: string; color: string }> {
  const seen = new Set<string>();
  const items: Array<{ title: string; cover: string; color: string }> = [];

  for (const span of spans) {
    const overflow = span.color === OVERFLOW_COLOR;
    const title = overflow ? OVERFLOW_LABEL : span.book;
    if (seen.has(title)) continue;
    seen.add(title);
    items.push({ title, cover: overflow ? "" : (covers.get(span.book) ?? ""), color: span.color });
  }
  return items;
}
