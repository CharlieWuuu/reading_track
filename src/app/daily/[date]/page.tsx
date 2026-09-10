"use client";

import { use } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { DayNav } from "@/features/overview/components/day-nav";
import { RangeOverview } from "@/features/overview/components/range-overview";
import { dayRange } from "@/utils/date-range";

export default function DailyPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);

  return (
    <>
      <PageHeader title="每日重點" action={<DayNav date={date} />} />
      <PageBody>
        <RangeOverview range={dayRange(date)} emptyLabel="這天還沒有新紀錄" />
      </PageBody>
    </>
  );
}
