"use client";

import { use } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RangeOverview } from "@/features/overview/components/range-overview";
import { WeekNav } from "@/features/weekly/components/week-nav";
import { isoWeekRange } from "@/utils/iso-week";

export default function WeeklyPage({
  params,
}: {
  params: Promise<{ year: string; week: string }>;
}) {
  const { year, week } = use(params);
  const isoWeek = { year: Number(year), week: Number(week) };

  return (
    <>
      <PageHeader title="每週重點" action={<WeekNav week={isoWeek} />} />
      <PageBody>
        <RangeOverview range={isoWeekRange(isoWeek)} emptyLabel="這週還沒有新紀錄" />
      </PageBody>
    </>
  );
}
