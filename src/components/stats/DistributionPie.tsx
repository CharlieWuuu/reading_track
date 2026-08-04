"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { DistributionSlice } from "@/lib/bookStats";

const CATEGORICAL = [
  "#184f95",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#4a3aa7",
  "#e34948",
];

/**
 * 佔比太小的區塊不拉線標示——線和字會互相疊在一起，反而什麼都看不清楚。
 * 這些項目仍然畫在圓環上，滑過去（手機是點一下）看得到名稱與本數。
 */
const MIN_LABEL_PERCENT = 0.06;

const RADIAN = Math.PI / 180;

function toSlots(data: DistributionSlice[]) {
  if (data.length <= CATEGORICAL.length) return data;
  const top = data.slice(0, CATEGORICAL.length - 1);
  const rest = data.slice(CATEGORICAL.length - 1);
  const otherValue = rest.reduce((sum, d) => sum + d.value, 0);
  return [...top, { name: "其他", value: otherValue }];
}

/** recharts 傳進來的欄位都是選填的，這裡自己收斂成數字再用 */
type LabelProps = {
  cx?: number | string;
  cy?: number | string;
  midAngle?: number;
  outerRadius?: number | string;
  percent?: number;
  name?: string;
  fill?: string;
};

function num(value: number | string | undefined): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

/** 從圓環邊緣往外拉一小段線，端點放「名稱 百分比」 */
function renderLabel({ cx, cy, midAngle, outerRadius, percent, name, fill }: LabelProps) {
  if (!percent || percent < MIN_LABEL_PERCENT) return <g />;

  const centerX = num(cx);
  const centerY = num(cy);
  const radius = num(outerRadius) + 14;
  const x = centerX + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
  const y = centerY + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

  return (
    <text
      x={x}
      y={y}
      textAnchor={x > centerX ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
      fill={fill}
    >
      {name} {Math.round(percent * 100)}%
    </text>
  );
}

function renderLabelLine({ cx, cy, midAngle, outerRadius, percent, fill }: LabelProps) {
  if (!percent || percent < MIN_LABEL_PERCENT) return <g />;

  const centerX = num(cx);
  const centerY = num(cy);
  const start = num(outerRadius) + 2;
  const end = num(outerRadius) + 11;
  const cos = Math.cos(-(midAngle ?? 0) * RADIAN);
  const sin = Math.sin(-(midAngle ?? 0) * RADIAN);

  return (
    <polyline
      points={`${centerX + start * cos},${centerY + start * sin} ${centerX + end * cos},${centerY + end * sin}`}
      stroke={fill}
      strokeWidth={1}
      fill="none"
    />
  );
}

export function DistributionPie({
  title,
  data,
  unit = "本",
  height = 240,
}: {
  title: string;
  data: DistributionSlice[];
  unit?: string;
  height?: number | `${number}%`;
}) {
  const slots = toSlots(data);

  if (slots.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-sm text-gray-400">
        {title}：尚無資料
      </div>
    );
  }

  return (
    <div className="viz-root flex h-full min-h-0 flex-col gap-3.5" data-palette="reading-track">
      <style>{`
        .viz-root {
          color-scheme: light;
          --surface-1: #fcfcfb;
          --text-primary: #0b0b0b;
          --text-secondary: #52514e;
          --grid: #e1e0d9;
        }
      `}</style>
      <p className="shrink-0 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {title}
      </p>
      <div className="min-h-0 flex-1">
      <ResponsiveContainer width="100%" height={height}>
        {/* 半徑用百分比，容器多高就畫多大；外圈留白給拉線的標籤 */}
        <PieChart margin={{ top: 8, right: 56, bottom: 8, left: 56 }}>
          <Pie
            data={slots}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="78%"
            // 從正上方開始、順時針排；預設是三點鐘方向逆時針
            startAngle={90}
            endAngle={-270}
            paddingAngle={2}
            label={renderLabel}
            labelLine={renderLabelLine}
            isAnimationActive={false}
          >
            {slots.map((_, i) => (
              <Cell
                key={i}
                fill={CATEGORICAL[i % CATEGORICAL.length]}
                stroke="var(--surface-1)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--surface-1)",
              border: "1px solid var(--grid)",
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={(value, name) => [`${value ?? 0} ${unit}`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
