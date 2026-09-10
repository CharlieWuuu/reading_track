"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const styles = {
  bar: "flex items-center gap-3",
  arrow: "text-ink-faint hover:text-ink flex size-7 items-center justify-center",
  range: "text-meta text-ink-faint tabular-nums",
};

const yearHref = (year: number): string => `/year/${year}`;

export function YearNav({ year }: { year: number }) {
  return (
    <div className={styles.bar}>
      <Link href={yearHref(year - 1)} aria-label="上一年" className={styles.arrow}>
        <ChevronLeft size={18} strokeWidth={1.5} aria-hidden />
      </Link>
      <span className={styles.range}>{year} 年</span>
      <Link href={yearHref(year + 1)} aria-label="下一年" className={styles.arrow}>
        <ChevronRight size={18} strokeWidth={1.5} aria-hidden />
      </Link>
    </div>
  );
}
