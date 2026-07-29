"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
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

function toSlots(data: DistributionSlice[]) {
  if (data.length <= CATEGORICAL.length) return data;
  const top = data.slice(0, CATEGORICAL.length - 1);
  const rest = data.slice(CATEGORICAL.length - 1);
  const otherValue = rest.reduce((sum, d) => sum + d.value, 0);
  return [...top, { name: "其他", value: otherValue }];
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
    <div className="viz-root" data-palette="reading-track">
      <style>{`
        .viz-root {
          color-scheme: light;
          --surface-1: #fcfcfb;
          --text-primary: #0b0b0b;
          --text-secondary: #52514e;
          --grid: #e1e0d9;
        }
      `}</style>
      <p className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {title}
      </p>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={slots}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            label={({ name, percent }) =>
              percent && percent > 0.08 ? `${name} ${Math.round(percent * 100)}%` : ""
            }
            labelLine={false}
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
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
