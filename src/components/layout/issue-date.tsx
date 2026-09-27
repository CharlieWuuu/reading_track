import { isoWeekOf } from "@/utils/iso-week";

// 報頭與首頁標題那行共用；伺服器與瀏覽器各算一次，跨午夜差一天只是一行小字
export function IssueDate({ className = "" }: { className?: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const [year, month, day] = today.split("-").map(Number);
  const { week } = isoWeekOf(today);

  return (
    <span
      suppressHydrationWarning
      className={`text-ink-faint flex items-center gap-3 ${className}`}
    >
      <span>{year} 年</span>
      <span>
        {month} 月 {day} 日
      </span>
      <span>第 {week} 週</span>
    </span>
  );
}
