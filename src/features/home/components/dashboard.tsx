"use client";

import { IssueDate } from "@/components/layout/issue-date";
import { monthRange } from "@/utils/date-range";
import { RangeOverview } from "./range-overview";

const styles = {
  frame: "flex flex-1 flex-col gap-5",
  head: "flex items-baseline justify-between gap-3.5",
  title: "font-serif text-page font-semibold",
  meta: "text-meta tabular-nums",
};

// 登入後的首頁：預設這個月
export function Dashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const month = Number(today.slice(5, 7));

  return (
    <div className={styles.frame}>
      <div className={styles.head}>
        <h1 className={styles.title}>{month}月</h1>
        <IssueDate className={styles.meta} />
      </div>
      <RangeOverview range={monthRange(today)} emptyLabel="這個月還沒有新紀錄" />
    </div>
  );
}
