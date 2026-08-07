export function ArticleKpiCards({
  total,
  completed,
  thisYear,
}: {
  total: number;
  completed: number;
  thisYear: number;
}) {
  const items = [
    { label: "累計文章", value: total, unit: "篇" },
    { label: "累計完成", value: completed, unit: "篇" },
    { label: "今年完成", value: thisYear, unit: "篇" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-0.5 rounded-lg border bg-white px-3 py-2.5"
        >
          <p className="text-xs text-gray-500">{item.label}</p>
          <p className="text-xl font-semibold tabular-nums">
            {item.value}
            <span className="ml-1 text-sm font-normal text-gray-500">{item.unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
