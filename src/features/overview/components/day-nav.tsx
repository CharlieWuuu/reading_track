"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const styles = {
  bar: "flex items-center gap-3",
  arrow: "text-ink-faint hover:text-ink flex size-7 items-center justify-center",
  range: "text-meta text-ink-faint tabular-nums",
};

const dayHref = (date: string): string => `/daily/${date}`;

function shiftDay(date: string, delta: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + delta));
  return shifted.toISOString().slice(0, 10);
}

const dayLabel = (date: string): string => {
  const [, m, d] = date.split("-").map(Number);
  return `${m} 月 ${d} 日`;
};

export function DayNav({ date }: { date: string }) {
  return (
    <div className={styles.bar}>
      <Link href={dayHref(shiftDay(date, -1))} aria-label="前一天" className={styles.arrow}>
        <ChevronLeft size={18} strokeWidth={1.5} aria-hidden />
      </Link>
      <span className={styles.range}>{dayLabel(date)}</span>
      <Link href={dayHref(shiftDay(date, 1))} aria-label="後一天" className={styles.arrow}>
        <ChevronRight size={18} strokeWidth={1.5} aria-hidden />
      </Link>
    </div>
  );
}
