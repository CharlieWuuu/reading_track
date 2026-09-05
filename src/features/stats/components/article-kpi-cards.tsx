/** 文章與紀事共用，差別只有單位是「篇」還是「筆」 */
export function ArticleKpiCards({
  completed,
  thisYear,
  avgPerMonth,
  unit = "篇",
}: {
  completed: number;
  thisYear: number;
  avgPerMonth: number;
  unit?: string;
}) {
  const items = [
    { label: "累計完成", value: String(completed), unit },
    { label: "今年完成", value: String(thisYear), unit },
    // 固定一位小數，跟書籍的平均每月同一個寫法
    { label: "平均每月", value: avgPerMonth.toFixed(1), unit },
  ];

  // 手機三張擠一排會讓數字比標籤還小，收成兩排
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-surface flex flex-col gap-0.5 border bg-white px-3 py-2.5"
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
