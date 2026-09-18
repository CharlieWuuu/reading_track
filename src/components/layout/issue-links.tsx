import Link from "next/link";
import { isoWeekOf } from "@/utils/iso-week";

/**
 * 年、日、週三段，各自連到那個粒度的回顧頁。
 *
 * 報頭（桌機）與首頁標題那行（手機看得到的那個）共用這一份——手機沒有報頭，
 * 日期那行是唯一進得去回顧頁的入口，不該只是一行不能點的小字。
 *
 * 伺服器與瀏覽器各算一次，跨午夜的那一瞬間會差一天，但那只是一行小字，
 * 不值得為它把整層變成 client-only。
 */
const LINK = "text-ink-faint hover:text-ink shrink-0";

/** 報頭把年份擺左邊、日期與週次擺右邊，所以要分開畫；不給 parts 就三段一起 */
export function IssueLinks({
  className = "",
  parts = "all",
}: {
  className?: string;
  parts?: "all" | "year" | "dayWeek";
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [year, month, day] = today.split("-").map(Number);
  const { week } = isoWeekOf(today);

  return (
    <span suppressHydrationWarning className={`flex items-center gap-3 ${className}`}>
      {parts !== "dayWeek" && (
        <Link href={`/year/${year}`} className={LINK}>
          {year} 年
        </Link>
      )}
      {parts !== "year" && (
        <>
          <Link href={`/daily/${today}`} className={LINK}>
            {month} 月 {day} 日
          </Link>
          <Link href={`/weekly/${year}/${week}`} className={LINK}>
            第 {week} 週
          </Link>
        </>
      )}
    </span>
  );
}
