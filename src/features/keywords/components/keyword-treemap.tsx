"use client";

import { ResponsiveContainer, Treemap } from "recharts";
import { KeywordEntry } from "@/features/keywords/utils/keyword-stats";
import { topicLabel } from "@/features/keywords/utils/topic-labels";
import { KeywordInfo } from "@/types/keyword";
import { CATEGORICAL } from "@/utils/chart-palette";

const styles = {
  wrap: "flex h-full min-h-0 flex-col gap-2",
  chart: "min-h-0 flex-1",
  legend: "flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1",
  legendItem: "flex items-center gap-1 text-[11px] text-gray-500",
  swatch: "h-2.5 w-2.5 shrink-0 rounded-thumb",
  empty: "flex h-full items-center justify-center text-xs text-gray-400",
};

/** 沒查到領域的都歸這一格，不要假裝分好類了 */
const UNCLASSIFIED = "未分類";
const LABEL_MIN_WIDTH = 44;
const LABEL_MIN_HEIGHT = 22;

type TreeLeaf = { name: string; size: number; group: string };

type TreeNode = { name: string; children: TreeLeaf[] };

type KeywordTreemapProps = {
  entries: KeywordEntry[];
  infos: Map<string, KeywordInfo>;
  /** 點某一格要做什麼；外層接去開那個關鍵字的編輯視窗 */
  onSelect: (name: string) => void;
};

/**
 * 依領域分群的樹狀圖：格子大小＝被幾本書提到。
 *
 * 點下去是編輯那個關鍵字，不是跳去書單——會在這張圖上點一格，
 * 多半是因為看到它分錯類或還沒分類，那當下就該能改。
 */
export function KeywordTreemap({ entries, infos, onSelect }: KeywordTreemapProps) {
  const data = groupByTopic(entries, infos);

  if (data.length === 0) {
    return <div className={styles.empty}>還沒有任何關鍵字</div>;
  }

  const groups = data.map((g) => g.name);

  return (
    <div className={styles.wrap}>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="size"
            // 每個領域一個顏色，同群的關鍵字共用，看得出哪幾個是一夥的
            content={<Cell groups={groups} />}
            onClick={(node: unknown) => {
              const name = (node as { name?: string })?.name;
              const isLeaf = entries.some((e) => e.name === name);
              if (isLeaf && name) onSelect(name);
            }}
            isAnimationActive={false}
          />
        </ResponsiveContainer>
      </div>

      {/* 格子小的時候標籤畫不下，顏色對應哪個領域只能靠圖例 */}
      <ul className={styles.legend}>
        {groups.map((group, i) => (
          <li key={group} className={styles.legendItem}>
            <span
              className={styles.swatch}
              style={{ background: CATEGORICAL[i % CATEGORICAL.length] }}
            />
            {group}
          </li>
        ))}
      </ul>
    </div>
  );
}

type CellProps = {
  groups: string[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  group?: string;
  depth?: number;
};

function Cell({ groups, x = 0, y = 0, width = 0, height = 0, name, group, depth }: CellProps) {
  // depth 0 是整張圖的外框，畫出來只會蓋住底下的格子
  if (depth === 0) return null;

  const color = CATEGORICAL[Math.max(0, groups.indexOf(group ?? name ?? "")) % CATEGORICAL.length];
  const showLabel = width > LABEL_MIN_WIDTH && height > LABEL_MIN_HEIGHT;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} stroke="#fff" strokeWidth={2} />
      {showLabel && (
        <text x={x + 6} y={y + 16} fill="#fff" fontSize={11}>
          {name}
        </text>
      )}
    </g>
  );
}

/** 一個關鍵字可能有多個領域，只取第一個——同時放進兩群會讓面積重複計算 */
function groupByTopic(entries: KeywordEntry[], infos: Map<string, KeywordInfo>): TreeNode[] {
  const groups = new Map<string, TreeLeaf[]>();

  for (const entry of entries) {
    const topic = topicLabel(infos.get(entry.name)?.topics.split("、")[0] ?? "") || UNCLASSIFIED;
    const leaf = { name: entry.name, size: entry.books.length, group: topic };
    const list = groups.get(topic);
    if (list) list.push(leaf);
    else groups.set(topic, [leaf]);
  }

  return [...groups.entries()]
    .map(([name, children]) => ({ name, children }))
    .sort((a, b) => b.children.length - a.children.length);
}
