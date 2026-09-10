"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IsoWeek, isoWeekRange, nextIsoWeek, previousIsoWeek } from "@/utils/iso-week";

const styles = {
  bar: "flex items-center gap-3",
  arrow: "text-ink-faint hover:text-ink flex size-7 items-center justify-center",
  range: "text-meta text-ink-faint tabular-nums",
};

const weekHref = ({ year, week }: IsoWeek): string => `/weekly/${year}/${week}`;

const rangeLabel = ({ start, end }: { start: string; end: string }): string =>
  `${start.slice(5).replace("-", "/")} – ${end.slice(5).replace("-", "/")}`;

export function WeekNav({ week }: { week: IsoWeek }) {
  const { start, end } = isoWeekRange(week);

  return (
    <div className={styles.bar}>
      <Link href={weekHref(previousIsoWeek(week))} aria-label="上一週" className={styles.arrow}>
        <ChevronLeft size={18} strokeWidth={1.5} aria-hidden />
      </Link>
      <span className={styles.range}>
        {week.year} 年第 {week.week} 週・{rangeLabel({ start, end })}
      </span>
      <Link href={weekHref(nextIsoWeek(week))} aria-label="下一週" className={styles.arrow}>
        <ChevronRight size={18} strokeWidth={1.5} aria-hidden />
      </Link>
    </div>
  );
}
