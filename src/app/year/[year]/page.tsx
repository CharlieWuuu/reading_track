"use client";

import { use } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RangeOverview } from "@/features/overview/components/range-overview";
import { YearNav } from "@/features/overview/components/year-nav";
import { yearRange } from "@/utils/date-range";

export default function YearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = use(params);
  const yearNum = Number(year);

  return (
    <>
      <PageHeader title="年度回顧" action={<YearNav year={yearNum} />} />
      <PageBody>
        <RangeOverview range={yearRange(yearNum)} emptyLabel="這一年還沒有新紀錄" />
      </PageBody>
    </>
  );
}
