"use client";

import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { DistributionGroup, DistributionSlice } from "@/utils/bookStats";
import { CATEGORICAL, SERIES_OVERFLOW, SERIES_PRIMARY } from "@/utils/chartPalette";

const styles = {
  root: "viz-root flex h-full min-h-0 flex-col gap-3.5",
  title: "shrink-0 text-sm font-medium",
  chart: "min-h-0 flex-1",
  empty: "flex h-full items-center justify-center text-xs text-gray-400",
  tooltip: "rounded border bg-white px-2 py-1 text-xs shadow",
  legend: "flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5",
  legendItem: "flex items-center gap-1.5 text-xs",
  swatch: "size-2.5 shrink-0 rounded-[2px]",
};

/**
 * 格子的深淺依名次遞減。
 *
 * 這裡的顏色不編碼任何額外資訊——面積已經是量了——它只是幫眼睛分辨相鄰的格子，
 * 所以用同一個色相的明度變化，而不是 CATEGORICAL 那組類別色。
 * 類別色循環使用會讓不同的東西撞成同色，讀起來像同一類。
 */
const MIN_OPACITY = 0.35;

const LABEL_MIN_WIDTH = 48;
const LABEL_MIN_HEIGHT = 26;

type DistributionTreemapProps = {
  title: string;
  /** 給了 groups 就畫兩層（大格子＝上層），否則一層 */
  data?: DistributionSlice[];
  groups?: DistributionGroup[];
  /** 一層時每格各自一色。類別少的時候比較好認，多到超過色票就沒有意義 */
  colorful?: boolean;
  unit?: string;
};

/** 類別很多時取代圓餅圖：面積＝數量，二十幾個類別也塞得進一個畫面 */
export function DistributionTreemap({
  title,
  data,
  groups,
  colorful = false,
  unit = "本",
}: DistributionTreemapProps) {
  const shaded = groups ? shadeGroups(groups) : shadeFlat(data ?? [], colorful);

  if (shaded.length === 0) {
    return <div className={styles.empty}>尚無資料</div>;
  }

  return (
    <div className={styles.root} data-palette="reading-track">
      <p className={styles.title} style={{ color: "var(--color-ink-viz)" }}>
        {title}
      </p>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap data={shaded} dataKey="value" content={<Cell />} isAnimationActive={false}>
            <Tooltip
              content={({ payload }) => {
                const slice = payload?.[0]?.payload as DistributionSlice | undefined;
                if (!slice?.name) return null;
                return (
                  <div className={styles.tooltip}>
                    {slice.name} {slice.value} {unit}
                  </div>
                );
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>

      {/* 兩層時上層＝一個色，格子小到寫不下名字也還認得出是哪個領域 */}
      {shaded.length > 1 && groups && (
        <ul className={styles.legend}>
          {shaded.map((group) => (
            <li key={group.name} className={styles.legendItem}>
              <span className={styles.swatch} style={{ background: group.color }} />
              <span style={{ color: "var(--color-ink-viz-muted)" }}>{group.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * 一層：只有面積在說話，所以同一個色相靠明度分辨相鄰的格子。
 * 兩層：顏色改成分群用——同一個上層共用一色，這時候顏色是有意義的。
 */
function shadeFlat(data: DistributionSlice[], colorful: boolean) {
  if (!colorful) {
    return data.map((slice, i) => ({
      ...slice,
      color: SERIES_PRIMARY,
      opacity: Math.max(MIN_OPACITY, 1 - i / data.length),
    }));
  }

  // 色票只有八階，第九名之後一律灰色——循環使用會讓不同的類別撞成同色
  return data.map((slice, i) => ({
    ...slice,
    color: i < CATEGORICAL.length ? CATEGORICAL[i] : SERIES_OVERFLOW,
    opacity: 1,
  }));
}

function shadeGroups(groups: DistributionGroup[]) {
  return groups.map((group, i) => ({
    name: group.name,
    color: CATEGORICAL[i % CATEGORICAL.length],
    children: group.children.map((child, j) => ({
      ...child,
      color: CATEGORICAL[i % CATEGORICAL.length],
      opacity: Math.max(MIN_OPACITY, 1 - j / Math.max(1, group.children.length)),
    })),
  }));
}

type CellProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  opacity?: number;
  color?: string;
  depth?: number;
};

function Cell({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  name,
  value,
  opacity = 1,
  color = SERIES_PRIMARY,
  depth,
}: CellProps) {
  // depth 0 是整張圖的外框，畫出來只會蓋住底下的格子
  if (depth === 0) return null;
  // 兩層的時候，上層那格只畫外框；底下的子格子自己會畫，蓋上去會擋住它們
  if (depth === 1 && !value) {
    return (
      <rect x={x} y={y} width={width} height={height} fill="none" stroke="#fff" strokeWidth={4} />
    );
  }

  const showLabel = width > LABEL_MIN_WIDTH && height > LABEL_MIN_HEIGHT;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        fillOpacity={opacity}
        stroke="#fff"
        strokeWidth={2}
      />
      {showLabel && (
        <text x={x + 6} y={y + 16} fill="#fff" fontSize={11}>
          {name}
          <tspan fillOpacity={0.75}> {value}</tspan>
        </text>
      )}
    </g>
  );
}
