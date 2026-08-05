export function KpiCards({
  total,
  thisYear,
  avgPerMonth,
  withNote,
  withQuotes,
}: {
  total: number;
  thisYear: number;
  avgPerMonth: number;
  withNote: number;
  withQuotes: number;
}) {
  const items = [
    { label: "累計完成", value: String(total), unit: "本" },
    { label: "今年完成", value: String(thisYear), unit: "本" },
    // 固定一位小數，1 本和 1.4 本差很多，整數會看不出來
    { label: "平均每月", value: avgPerMonth.toFixed(1), unit: "本" },
    { label: "寫了心得", value: String(withNote), unit: "本" },
    { label: "記下佳句", value: String(withQuotes), unit: "本" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5 rounded-lg border bg-white px-3 py-2.5">
          <p className="text-xs text-gray-500">{item.label}</p>
          <p className="text-xl font-semibold tabular-nums">
            {item.value}
            <span className="ml-1 text-sm font-normal text-gray-500">
              {item.unit}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
